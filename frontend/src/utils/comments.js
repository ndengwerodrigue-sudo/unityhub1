export function addCommentToTree(comments, newComment) {
  if (!newComment.parentId) {
    return [...comments, newComment]
  }

  return comments.map((comment) => {
    if (comment.id === newComment.parentId) {
      return {
        ...comment,
        replies: [...(comment.replies || []), newComment],
      }
    }
    if (comment.replies?.length) {
      return {
        ...comment,
        replies: addCommentToTree(comment.replies, newComment),
      }
    }
    return comment
  })
}

export function updateCommentLikeInTree(comments, commentId, likes, isLiked) {
  return comments.map((comment) => {
    if (comment.id === commentId) {
      return { ...comment, likes, isLiked }
    }
    if (comment.replies?.length) {
      return {
        ...comment,
        replies: updateCommentLikeInTree(comment.replies, commentId, likes, isLiked),
      }
    }
    return comment
  })
}

export function countCommentsInTree(comments) {
  return comments.reduce((sum, comment) => {
    return sum + 1 + countCommentsInTree(comment.replies || [])
  }, 0)
}
