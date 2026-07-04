const db = require('../db');

let supportsRepostOfIdColumn = null;
let supportsPostMediaColumns = null;
let supportsPostMediaTable = null;

async function hasRepostOfIdColumn() {
  if (supportsRepostOfIdColumn !== null) return supportsRepostOfIdColumn;
  const result = await db.query(
    `SELECT 1 FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = 'posts' AND column_name = 'repost_of_id'
     LIMIT 1`
  );
  supportsRepostOfIdColumn = result.rows.length > 0;
  return supportsRepostOfIdColumn;
}

async function hasPostMediaColumns() {
  if (supportsPostMediaColumns !== null) return supportsPostMediaColumns;
  const result = await db.query(
    `SELECT 1 FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = 'posts' AND column_name = 'videos'
     LIMIT 1`
  );
  supportsPostMediaColumns = result.rows.length > 0;
  return supportsPostMediaColumns;
}

async function hasPostMediaTable() {
  if (supportsPostMediaTable !== null) return supportsPostMediaTable;
  const result = await db.query(
    `SELECT 1 FROM information_schema.tables
     WHERE table_schema = 'public' AND table_name = 'post_media'
     LIMIT 1`
  );
  supportsPostMediaTable = result.rows.length > 0;
  return supportsPostMediaTable;
}

async function savePostMedia(postId, videos, audioTrack) {
  const v = Array.isArray(videos) ? videos : [];
  const a = audioTrack ? JSON.stringify(audioTrack) : null;
  await db.query(
    `INSERT INTO post_media (post_id, videos, audio_track, updated_at)
     VALUES ($1, $2::text[], $3::jsonb, NOW())
     ON CONFLICT (post_id) DO UPDATE SET
       videos = EXCLUDED.videos,
       audio_track = EXCLUDED.audio_track,
       updated_at = NOW()`,
    [postId, v, a]
  );
}

const MEDIA_JOIN = `
  LEFT JOIN post_media pm ON pm.post_id = p.id
`;

const MEDIA_SELECT = `
  COALESCE(pm.videos, '{}') AS videos,
  pm.audio_track AS audio_track
`;

class Post {
  constructor(row = {}) {
    this.id = row.id || null;
    this.authorId = row.author_id || row.authorId || null;
    this.content = row.content || '';
    const raw = row.images ?? row.images_json;
    this.images = Array.isArray(raw) ? raw : (raw ? [raw] : []);
    const rawVideos = row.videos;
    this.videos = Array.isArray(rawVideos) ? rawVideos : (rawVideos ? [rawVideos] : []);
    const rawAudio = row.audio_track ?? row.audioTrack;
    this.audioTrack =
      rawAudio && typeof rawAudio === 'object' && rawAudio.src ? rawAudio : null;
    this.createdAt = row.created_at || row.createdAt || new Date();
    this.updatedAt = row.updated_at || row.updatedAt || new Date();

    this.author = row.author || (row.author_name
      ? {
          name: row.author_name,
          role: row.author_role,
          location: row.author_location,
          avatar: row.author_avatar,
        }
      : null);

    this.repostOfId = row.repost_of_id || row.repostOfId || null;
    this.likes = Number(row.likes_count ?? row.likes ?? 0) || 0;
    this.comments = Number(row.comments_count ?? row.comments ?? 0) || 0;
    this.favorites = Number(row.favorites_count ?? row.favorites ?? 0) || 0;
    this.reposts = Number(row.reposts_count ?? row.reposts ?? 0) || 0;
    this.isLiked = !!row.is_liked;
    this.isFavorited = !!row.is_favorited;
    this.isReposted = !!row.is_reposted;
  }

  static async findPaginated({ page = 1, limit = 10, userId = null }) {
    const offset = (page - 1) * limit;

    const countResult = await db.query(
      'SELECT COUNT(*)::int AS count FROM posts',
      []
    );
    const total = countResult.rows[0].count;

    const userParam = userId ? [userId] : [];
    const userJoinLikes = userId
      ? 'LEFT JOIN post_likes ul ON ul.post_id = p.id AND ul.user_id = $3'
      : '';
    const userJoinFav = userId
      ? 'LEFT JOIN post_favorites uf ON uf.post_id = p.id AND uf.user_id = $3'
      : '';
    const userJoinRepost = userId
      ? 'LEFT JOIN post_reposts ur ON ur.post_id = p.id AND ur.user_id = $3'
      : '';
    const isLikedSel = userId ? '(ul.user_id IS NOT NULL) AS is_liked' : 'FALSE AS is_liked';
    const isFavSel = userId ? '(uf.user_id IS NOT NULL) AS is_favorited' : 'FALSE AS is_favorited';
    const isRepostSel = userId ? '(ur.user_id IS NOT NULL) AS is_reposted' : 'FALSE AS is_reposted';

    const params = userId ? [limit, offset, userId] : [limit, offset];

    const result = await db.query(
      `SELECT
         p.*,
         u.name AS author_name,
         u.role AS author_role,
         u.location AS author_location,
         u.avatar AS author_avatar,
         COALESCE(l.likes_count, 0) AS likes_count,
         COALESCE(c.comments_count, 0) AS comments_count,
         COALESCE(f.favorites_count, 0) AS favorites_count,
         COALESCE(r.reposts_count, 0) AS reposts_count,
         ${MEDIA_SELECT},
         ${isLikedSel},
         ${isFavSel},
         ${isRepostSel}
       FROM posts p
       JOIN users u ON u.id = p.author_id
       LEFT JOIN (
         SELECT post_id, COUNT(*)::int AS likes_count
         FROM post_likes
         GROUP BY post_id
       ) l ON l.post_id = p.id
       LEFT JOIN (
         SELECT post_id, COUNT(*)::int AS comments_count
         FROM post_comments
         GROUP BY post_id
       ) c ON c.post_id = p.id
       LEFT JOIN (
         SELECT post_id, COUNT(*)::int AS favorites_count
         FROM post_favorites
         GROUP BY post_id
       ) f ON f.post_id = p.id
       LEFT JOIN (
         SELECT post_id, COUNT(*)::int AS reposts_count
         FROM post_reposts
         GROUP BY post_id
       ) r ON r.post_id = p.id
       ${MEDIA_JOIN}
       ${userJoinLikes}
       ${userJoinFav}
       ${userJoinRepost}
       ORDER BY p.created_at DESC
       LIMIT $1 OFFSET $2`,
      params
    );

    const posts = result.rows.map(row => new Post(row));
    return { posts, total };
  }

  static async findById(id) {
    const result = await db.query(
      `SELECT
         p.*,
         u.name AS author_name,
         u.role AS author_role,
         u.location AS author_location,
         u.avatar AS author_avatar,
         COALESCE(l.likes_count, 0) AS likes_count,
         COALESCE(c.comments_count, 0) AS comments_count,
         ${MEDIA_SELECT}
       FROM posts p
       JOIN users u ON u.id = p.author_id
       LEFT JOIN (
         SELECT post_id, COUNT(*)::int AS likes_count
         FROM post_likes
         GROUP BY post_id
       ) l ON l.post_id = p.id
       LEFT JOIN (
         SELECT post_id, COUNT(*)::int AS comments_count
         FROM post_comments
         GROUP BY post_id
       ) c ON c.post_id = p.id
       ${MEDIA_JOIN}
       WHERE p.id = $1
       LIMIT 1`,
      [id]
    );
    if (result.rows.length === 0) return null;
    return new Post(result.rows[0]);
  }

  static async countByAuthorId(authorId) {
    const result = await db.query(
      'SELECT COUNT(*)::int AS count FROM posts WHERE author_id = $1',
      [authorId]
    );
    return result.rows[0].count;
  }

  static async countToday() {
    const result = await db.query(
      "SELECT COUNT(*)::int AS count FROM posts WHERE created_at >= CURRENT_DATE",
      []
    );
    return result.rows[0].count;
  }

  async save() {
    const now = new Date();
    const hasMediaCols = await hasPostMediaColumns();
    const hasMediaTable = await hasPostMediaTable();
    const videos = Array.isArray(this.videos) ? this.videos : [];
    const audioTrackJson = this.audioTrack ? JSON.stringify(this.audioTrack) : null;
    const canStoreMedia = hasMediaCols || hasMediaTable;

    if ((videos.length > 0 || this.audioTrack) && !canStoreMedia) {
      const err = new Error(
        'Post media storage not ready. Restart the backend to run migrations.'
      );
      err.statusCode = 500;
      throw err;
    }

    if (!this.id) {
      const images = Array.isArray(this.images) ? this.images : [];
      let result;

      if (await hasRepostOfIdColumn()) {
        if (hasMediaCols) {
          result = await db.query(
            `INSERT INTO posts (
               author_id, content, images, videos, audio_track, repost_of_id, created_at, updated_at
             )
             VALUES ($1, $2, $3::text[], $4::text[], $5::jsonb, $6, $7, $8)
             RETURNING *`,
            [
              this.authorId,
              this.content,
              images,
              videos,
              audioTrackJson,
              this.repostOfId || null,
              now,
              now,
            ]
          );
        } else {
          result = await db.query(
            `INSERT INTO posts (
               author_id, content, images, repost_of_id, created_at, updated_at
             )
             VALUES ($1, $2, $3::text[], $4, $5, $6)
             RETURNING *`,
            [
              this.authorId,
              this.content,
              images,
              this.repostOfId || null,
              now,
              now,
            ]
          );
        }
      } else if (hasMediaCols) {
        result = await db.query(
          `INSERT INTO posts (author_id, content, images, videos, audio_track, created_at, updated_at)
           VALUES ($1, $2, $3::text[], $4::text[], $5::jsonb, $6, $7)
           RETURNING *`,
          [this.authorId, this.content, images, videos, audioTrackJson, now, now]
        );
      } else {
        result = await db.query(
          `INSERT INTO posts (author_id, content, images, created_at, updated_at)
           VALUES ($1, $2, $3::text[], $4, $5)
           RETURNING *`,
          [this.authorId, this.content, images, now, now]
        );
      }

      const row = result.rows[0];
      this.id = row.id;
      this.authorId = row.author_id;
      this.content = row.content;
      this.images = row.images || [];
      this.createdAt = row.created_at;
      this.updatedAt = row.updated_at;
      this.likes = 0;
      this.comments = 0;

      if (hasMediaTable) {
        await savePostMedia(this.id, videos, this.audioTrack);
        this.videos = videos;
      } else {
        this.videos = row.videos || [];
        this.audioTrack = row.audio_track || null;
      }
    } else {
      let result;
      if (hasMediaCols) {
        result = await db.query(
          `UPDATE posts
           SET content = $1,
               images = $2::text[],
               videos = $3::text[],
               audio_track = $4::jsonb,
               updated_at = $5
           WHERE id = $6
           RETURNING *`,
          [
            this.content,
            Array.isArray(this.images) ? this.images : [],
            videos,
            audioTrackJson,
            now,
            this.id,
          ]
        );
      } else {
        result = await db.query(
          `UPDATE posts
           SET content = $1,
               images = $2::text[],
               updated_at = $3
           WHERE id = $4
           RETURNING *`,
          [
            this.content,
            Array.isArray(this.images) ? this.images : [],
            now,
            this.id,
          ]
        );
      }

      const row = result.rows[0];
      this.content = row.content;
      this.images = row.images || [];
      this.createdAt = row.created_at;
      this.updatedAt = row.updated_at;

      if (hasMediaTable) {
        await savePostMedia(this.id, videos, this.audioTrack);
        this.videos = videos;
      } else {
        this.videos = row.videos || [];
        this.audioTrack = row.audio_track || null;
      }
    }

    return this;
  }

  static async deleteById(id) {
    await db.query('DELETE FROM posts WHERE id = $1', [id]);
  }

  static async toggleLike({ postId, userId }) {
    const existing = await db.query(
      'SELECT 1 FROM post_likes WHERE post_id = $1 AND user_id = $2 LIMIT 1',
      [postId, userId]
    );

    let isLiked;
    if (existing.rows.length) {
      await db.query(
        'DELETE FROM post_likes WHERE post_id = $1 AND user_id = $2',
        [postId, userId]
      );
      isLiked = false;
    } else {
      await db.query(
        'INSERT INTO post_likes (post_id, user_id) VALUES ($1, $2) ON CONFLICT (post_id, user_id) DO NOTHING',
        [postId, userId]
      );
      isLiked = true;
    }

    const countResult = await db.query(
      'SELECT COUNT(*)::int AS count FROM post_likes WHERE post_id = $1',
      [postId]
    );

    return {
      isLiked,
      likes: countResult.rows[0].count,
    };
  }

  static mapCommentRow(row) {
    return {
      id: row.id,
      postId: row.post_id,
      authorId: row.author_id,
      parentId: row.parent_id || null,
      content: row.content,
      createdAt: row.created_at,
      likes: Number(row.likes_count) || 0,
      isLiked: !!row.is_liked,
      author: {
        name: row.author_name,
        avatar: row.author_avatar,
        role: row.author_role,
      },
      replies: [],
    };
  }

  static buildCommentTree(flat) {
    const byId = new Map();
    flat.forEach((c) => byId.set(c.id, { ...c, replies: [] }));
    const roots = [];
    byId.forEach((c) => {
      if (c.parentId && byId.has(c.parentId)) {
        byId.get(c.parentId).replies.push(c);
      } else {
        roots.push(c);
      }
    });
    return roots;
  }

  static async addComment({ postId, authorId, content, parentId = null }) {
    if (parentId) {
      const parentResult = await db.query(
        'SELECT id, post_id, author_id FROM post_comments WHERE id = $1 LIMIT 1',
        [parentId]
      );
      if (!parentResult.rows.length || parentResult.rows[0].post_id !== postId) {
        const err = new Error('Invalid parent comment');
        err.statusCode = 400;
        throw err;
      }
    }

    const insertResult = await db.query(
      `INSERT INTO post_comments (post_id, author_id, content, parent_id)
       VALUES ($1, $2, $3, $4)
       RETURNING id, post_id, author_id, content, parent_id, created_at`,
      [postId, authorId, content, parentId || null]
    );

    const row = insertResult.rows[0];
    const authorResult = await db.query(
      'SELECT name, avatar, role FROM users WHERE id = $1 LIMIT 1',
      [authorId]
    );
    const authorRow = authorResult.rows[0] || {};

    const countResult = await db.query(
      'SELECT COUNT(*)::int AS count FROM post_comments WHERE post_id = $1',
      [postId]
    );

    let parentAuthorId = null;
    if (parentId) {
      const parentAuthor = await db.query(
        'SELECT author_id FROM post_comments WHERE id = $1 LIMIT 1',
        [parentId]
      );
      parentAuthorId = parentAuthor.rows[0]?.author_id || null;
    }

    return {
      comments: countResult.rows[0].count,
      parentAuthorId,
      comment: {
        id: row.id,
        postId: row.post_id,
        authorId: row.author_id,
        parentId: row.parent_id || null,
        content: row.content,
        createdAt: row.created_at,
        likes: 0,
        isLiked: false,
        replies: [],
        author: {
          name: authorRow.name || 'Unknown',
          avatar: authorRow.avatar || '',
          role: authorRow.role || '',
        },
      },
    };
  }

  static async listComments(postId, userId = null) {
    const userJoin = userId
      ? 'LEFT JOIN comment_likes ul ON ul.comment_id = c.id AND ul.user_id = $2'
      : '';
    const isLikedSel = userId ? '(ul.user_id IS NOT NULL) AS is_liked' : 'FALSE AS is_liked';
    const params = userId ? [postId, userId] : [postId];

    const result = await db.query(
      `SELECT
         c.id,
         c.post_id,
         c.author_id,
         c.parent_id,
         c.content,
         c.created_at,
         u.name AS author_name,
         u.avatar AS author_avatar,
         u.role AS author_role,
         COALESCE(l.likes_count, 0) AS likes_count,
         ${isLikedSel}
       FROM post_comments c
       JOIN users u ON u.id = c.author_id
       LEFT JOIN (
         SELECT comment_id, COUNT(*)::int AS likes_count
         FROM comment_likes
         GROUP BY comment_id
       ) l ON l.comment_id = c.id
       ${userJoin}
       WHERE c.post_id = $1
       ORDER BY c.created_at ASC`,
      params
    );

    const flat = result.rows.map((row) => Post.mapCommentRow(row));
    return Post.buildCommentTree(flat);
  }

  static async toggleCommentLike({ commentId, userId }) {
    const commentResult = await db.query(
      'SELECT id, post_id, author_id FROM post_comments WHERE id = $1 LIMIT 1',
      [commentId]
    );
    if (!commentResult.rows.length) {
      const err = new Error('Comment not found');
      err.statusCode = 404;
      throw err;
    }

    const comment = commentResult.rows[0];
    const existing = await db.query(
      'SELECT 1 FROM comment_likes WHERE comment_id = $1 AND user_id = $2 LIMIT 1',
      [commentId, userId]
    );

    let isLiked;
    if (existing.rows.length) {
      await db.query(
        'DELETE FROM comment_likes WHERE comment_id = $1 AND user_id = $2',
        [commentId, userId]
      );
      isLiked = false;
    } else {
      await db.query(
        'INSERT INTO comment_likes (comment_id, user_id) VALUES ($1, $2) ON CONFLICT (comment_id, user_id) DO NOTHING',
        [commentId, userId]
      );
      isLiked = true;
    }

    const countResult = await db.query(
      'SELECT COUNT(*)::int AS count FROM comment_likes WHERE comment_id = $1',
      [commentId]
    );

    return {
      commentId,
      postId: comment.post_id,
      authorId: comment.author_id,
      isLiked,
      likes: countResult.rows[0].count,
    };
  }

  static async toggleFavorite({ postId, userId }) {
    const existing = await db.query(
      'SELECT 1 FROM post_favorites WHERE post_id = $1 AND user_id = $2 LIMIT 1',
      [postId, userId]
    );

    let isFavorited;
    if (existing.rows.length) {
      await db.query(
        'DELETE FROM post_favorites WHERE post_id = $1 AND user_id = $2',
        [postId, userId]
      );
      isFavorited = false;
    } else {
      await db.query(
        'INSERT INTO post_favorites (post_id, user_id) VALUES ($1, $2) ON CONFLICT (post_id, user_id) DO NOTHING',
        [postId, userId]
      );
      isFavorited = true;
    }

    const countResult = await db.query(
      'SELECT COUNT(*)::int AS count FROM post_favorites WHERE post_id = $1',
      [postId]
    );

    return {
      isFavorited,
      favorites: countResult.rows[0].count,
    };
  }

  static async repost({ originalPostId, userId, authorName }) {
    const existing = await db.query(
      'SELECT 1 FROM post_reposts WHERE post_id = $1 AND user_id = $2 LIMIT 1',
      [originalPostId, userId]
    );
    if (existing.rows.length) {
      const err = new Error('You already reposted this');
      err.statusCode = 400;
      throw err;
    }

    const original = await Post.findById(originalPostId);
    if (!original) {
      const err = new Error('Post not found');
      err.statusCode = 404;
      throw err;
    }

    const repostPost = new Post();
    repostPost.authorId = userId;
    repostPost.repostOfId = originalPostId;
    repostPost.content = `🔁 Reposted by ${authorName || 'a member'}\n\n${original.content}`;
    repostPost.images = Array.isArray(original.images) ? [...original.images] : [];
    repostPost.videos = Array.isArray(original.videos) ? [...original.videos] : [];
    repostPost.audioTrack = original.audioTrack ? { ...original.audioTrack } : null;
    await repostPost.save();

    await db.query(
      `INSERT INTO post_reposts (post_id, user_id, repost_post_id)
       VALUES ($1, $2, $3) ON CONFLICT (post_id, user_id) DO NOTHING`,
      [originalPostId, userId, repostPost.id]
    );

    const countResult = await db.query(
      'SELECT COUNT(*)::int AS count FROM post_reposts WHERE post_id = $1',
      [originalPostId]
    );

    const fullRepost = await Post.findById(repostPost.id);

    return {
      isReposted: true,
      reposts: countResult.rows[0].count,
      repostPost: fullRepost,
    };
  }

  toJSON() {
    return {
      id: this.id,
      authorId: this.authorId != null ? String(this.authorId) : null,
      author: this.author,
      content: this.content,
      images: this.images || [],
      videos: this.videos || [],
      audioTrack: this.audioTrack || null,
      likes: this.likes || 0,
      comments: this.comments || 0,
      favorites: this.favorites || 0,
      reposts: this.reposts || 0,
      isLiked: !!this.isLiked,
      isFavorited: !!this.isFavorited,
      isReposted: !!this.isReposted,
      repostOfId: this.repostOfId || null,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}

module.exports = Post;
