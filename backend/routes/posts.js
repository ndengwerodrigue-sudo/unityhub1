const express = require('express');
const { body, validationResult } = require('express-validator');
const Post = require('../models/Post');
const { protect, admin, optionalAuth } = require('../middleware/auth');
const { normalizeAudioTrack } = require('../utils/postMedia');
const { uploadPostMedia } = require('../utils/postUpload');
const {
  notifyPostLiked,
  notifyPostCommented,
  notifyCommentReplied,
  notifyCommentLiked,
  notifyPostReposted,
  notifyPostSaved,
} = require('../utils/notificationService');

const router = express.Router();

// @route   POST /api/posts/media/upload
// @desc    Upload image, video, or audio for a post
// @access  Private
router.post('/media/upload', protect, (req, res) => {
  uploadPostMedia.single('file')(req, res, (err) => {
    if (err) {
      return res.status(400).json({ message: err.message || 'Upload failed' });
    }
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const url = `/uploads/posts/${req.file.filename}`;
    console.log(`[posts] media uploaded: ${url} (${Math.round(req.file.size / 1024)}KB)`);

    res.status(201).json({
      url,
      name: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
    });
  });
});

// @route   GET /api/posts
// @desc    Get all posts (public)
// @access  Public
router.get('/', optionalAuth, async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;

    const userId = req.user?.id || req.user?._id || null;
    const { posts, total } = await Post.findPaginated({ page, limit, userId });

    res.json({
      message: 'Posts retrieved successfully',
      posts: posts.map(p => p.toJSON()),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get posts error:', error);
    res.status(500).json({
      message: 'Server error retrieving posts',
      ...(process.env.NODE_ENV === 'development' && { error: error.message }),
    });
  }
});

// @route   GET /api/posts/:id/comments
// @desc    List comments on a post (public, nested with replies)
// @access  Public
router.get('/:id/comments', optionalAuth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const userId = req.user?.id || req.user?._id || null;
    const comments = await Post.listComments(req.params.id, userId);

    res.json({
      message: 'Comments retrieved successfully',
      comments,
      total: comments.reduce(
        (sum, c) => sum + 1 + (c.replies?.length || 0),
        0
      ),
    });
  } catch (error) {
    console.error('Get comments error:', error);
    res.status(500).json({ message: 'Server error retrieving comments' });
  }
});

// @route   POST /api/posts/:postId/comments/:commentId/like
// @desc    Like/unlike a comment
// @access  Private
router.post('/:postId/comments/:commentId/like', protect, async (req, res) => {
  try {
    const actorId = req.user.id || req.user._id;
    const result = await Post.toggleCommentLike({
      commentId: req.params.commentId,
      userId: actorId,
    });

    if (result.postId !== req.params.postId) {
      return res.status(400).json({ message: 'Comment does not belong to this post' });
    }

    if (result.isLiked) {
      await notifyCommentLiked({
        commentAuthorId: result.authorId,
        postId: result.postId,
        actor: { id: actorId, name: req.user.name },
      });
    }

    res.json({
      message: result.isLiked ? 'Comment liked' : 'Comment unliked',
      commentId: result.commentId,
      likes: result.likes,
      isLiked: result.isLiked,
    });
  } catch (error) {
    console.error('Like comment error:', error);
    res.status(error.statusCode || 500).json({
      message: error.message || 'Server error liking comment',
    });
  }
});

// @route   GET /api/posts/:id
// @desc    Get post by ID
// @access  Public
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    res.json({
      message: 'Post retrieved successfully',
      post: post.toJSON(),
    });
  } catch (error) {
    console.error('Get post error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid post ID' });
    }
    res.status(500).json({ message: 'Server error retrieving post' });
  }
});

// @route   POST /api/posts
// @desc    Create a new post
// @access  Private
router.post('/', protect, [
  body('content').trim().isLength({ min: 1, max: 2000 }).withMessage('Content must be between 1 and 2000 characters')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const { content, images, videos, audioTrack } = req.body;

    const post = new Post();
    post.authorId = req.user.id || req.user._id;
    post.content = content;
    post.images = Array.isArray(images) ? images : [];
    post.videos = Array.isArray(videos) ? videos.slice(0, 3) : [];
    post.audioTrack = normalizeAudioTrack(audioTrack);

    if (post.videos.length > 0) {
      console.log(`[posts] create: ${post.videos.length} video(s) — ${post.videos[0].slice(0, 80)}...`);
    } else if (Array.isArray(videos) && videos.length > 0) {
      console.warn('[posts] create: client sent videos but none were stored — check payload');
    }

    await post.save();

    // Reload with author info and counts
    const fullPost = await Post.findById(post.id);
    if (!fullPost) {
      return res.status(500).json({ message: 'Post created but failed to load' });
    }

    console.log(`[posts] created id=${fullPost.id} videos=${(fullPost.videos || []).length}`);

    res.status(201).json({
      message: 'Post created successfully',
      post: fullPost.toJSON(),
    });
  } catch (error) {
    console.error('Create post error:', error);
    res.status(error.statusCode || 500).json({
      message: error.message || 'Server error creating post',
      ...(process.env.NODE_ENV === 'development' && { error: error.message }),
    });
  }
});

// @route   PUT /api/posts/:id
// @desc    Update post (author only)
// @access  Private
router.put('/:id', protect, [
  body('content').trim().isLength({ min: 1, max: 2000 }).withMessage('Content must be between 1 and 2000 characters')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const post = await Post.findById(req.params.id);
    
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Check if user is the author or admin
    if ((post.authorId !== (req.user.id || req.user._id)) && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to update this post' });
    }

    const { content, images, videos, audioTrack } = req.body;
    post.content = content;
    if (images !== undefined) {
      post.images = Array.isArray(images) ? images : [];
    }
    if (videos !== undefined) {
      post.videos = Array.isArray(videos) ? videos.slice(0, 3) : [];
    }
    if (audioTrack !== undefined) {
      post.audioTrack = normalizeAudioTrack(audioTrack);
    }

    await post.save();

    const fullPost = await Post.findById(post.id);
    if (!fullPost) {
      return res.status(500).json({ message: 'Post updated but failed to load' });
    }

    res.json({
      message: 'Post updated successfully',
      post: fullPost.toJSON(),
    });
  } catch (error) {
    console.error('Update post error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid post ID' });
    }
    res.status(error.statusCode || 500).json({
      message: error.message || 'Server error updating post',
      ...(process.env.NODE_ENV === 'development' && { error: error.message }),
    });
  }
});

// @route   DELETE /api/posts/:id
// @desc    Delete post (author or admin)
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Check if user is the author or admin
    if ((post.authorId !== (req.user.id || req.user._id)) && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete this post' });
    }

    await Post.deleteById(req.params.id);

    res.json({
      message: 'Post deleted successfully'
    });
  } catch (error) {
    console.error('Delete post error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid post ID' });
    }
    res.status(500).json({ message: 'Server error deleting post' });
  }
});

// @route   POST /api/posts/:id/like
// @desc    Like/unlike a post
// @access  Private
router.post('/:id/like', protect, async (req, res) => {
  try {
    const actorId = req.user.id || req.user._id;
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const { isLiked, likes } = await Post.toggleLike({
      postId: req.params.id,
      userId: actorId,
    });

    if (isLiked) {
      await notifyPostLiked({
        post,
        actor: { id: actorId, name: req.user.name },
      });
    }

    res.json({
      message: isLiked ? 'Post liked successfully' : 'Post unliked successfully',
      likes,
      isLiked,
    });
  } catch (error) {
    console.error('Like post error:', error);
    res.status(500).json({ message: 'Server error liking post' });
  }
});

// @route   POST /api/posts/:id/favorite
// @desc    Favorite/unfavorite a post
// @access  Private
router.post('/:id/favorite', protect, async (req, res) => {
  try {
    const actorId = req.user.id || req.user._id;
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const { isFavorited, favorites } = await Post.toggleFavorite({
      postId: req.params.id,
      userId: actorId,
    });

    if (isFavorited) {
      await notifyPostSaved({
        post,
        actor: { id: actorId, name: req.user.name },
      });
    }

    res.json({
      message: isFavorited ? 'Added to favorites' : 'Removed from favorites',
      favorites,
      isFavorited,
    });
  } catch (error) {
    console.error('Favorite post error:', error);
    res.status(500).json({ message: 'Server error updating favorite' });
  }
});

// @route   POST /api/posts/:id/repost
// @desc    Repost to your feed
// @access  Private
router.post('/:id/repost', protect, async (req, res) => {
  try {
    const actorId = req.user.id || req.user._id;
    const original = await Post.findById(req.params.id);
    if (!original) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const result = await Post.repost({
      originalPostId: req.params.id,
      userId: actorId,
      authorName: req.user.name,
    });

    await notifyPostReposted({
      post: original,
      actor: { id: actorId, name: req.user.name },
    });

    res.status(201).json({
      message: 'Post reposted successfully',
      reposts: result.reposts,
      isReposted: result.isReposted,
      post: result.repostPost.toJSON(),
    });
  } catch (error) {
    console.error('Repost error:', error);
    const status = error.statusCode || 500;
    res.status(status).json({
      message: error.message || 'Server error reposting',
    });
  }
});

// @route   POST /api/posts/:id/comments
// @desc    Add comment to post
// @access  Private
router.post('/:id/comments', protect, [
  body('content').trim().isLength({ min: 1, max: 500 }).withMessage('Comment must be between 1 and 500 characters'),
  body('parentId').optional({ nullable: true }).isUUID().withMessage('Invalid parent comment'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array(),
      });
    }

    const { content, parentId } = req.body;
    const actorId = req.user.id || req.user._id;

    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const result = await Post.addComment({
      postId: req.params.id,
      authorId: actorId,
      content,
      parentId: parentId || null,
    });

    const actor = { id: actorId, name: req.user.name };

    if (parentId) {
      if (result.parentAuthorId) {
        await notifyCommentReplied({
          parentCommentAuthorId: result.parentAuthorId,
          post,
          actor,
        });
      }
      if (String(post.authorId) !== String(result.parentAuthorId)) {
        await notifyPostCommented({ post, actor, isReply: true });
      }
    } else {
      await notifyPostCommented({ post, actor, isReply: false });
    }

    res.status(201).json({
      message: parentId ? 'Reply added successfully' : 'Comment added successfully',
      comments: result.comments,
      comment: result.comment,
    });
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(error.statusCode || 500).json({
      message: error.message || 'Server error adding comment',
    });
  }
});

module.exports = router;
