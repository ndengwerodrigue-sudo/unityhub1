const Notification = require('../models/Notification');

const feedLink = (postId) => `/feed?post=${postId}`;

async function notifyUser({ userId, actorId, type, title, message, link }) {
  if (!userId || (actorId && String(userId) === String(actorId))) return null;
  try {
    return await Notification.create({ userId, type, title, message, link });
  } catch (err) {
    console.warn('Notification skipped:', err.message);
    return null;
  }
}

async function notifyPostLiked({ post, actor }) {
  if (!post?.authorId) return;
  const name = actor?.name || 'Someone';
  return notifyUser({
    userId: post.authorId,
    actorId: actor?.id,
    type: 'like',
    title: 'New like on your post',
    message: `${name} liked your post`,
    link: feedLink(post.id),
  });
}

async function notifyPostCommented({ post, actor, isReply = false }) {
  if (!post?.authorId) return;
  const name = actor?.name || 'Someone';
  return notifyUser({
    userId: post.authorId,
    actorId: actor?.id,
    type: isReply ? 'reply' : 'comment',
    title: isReply ? 'New reply on your post' : 'New comment on your post',
    message: isReply
      ? `${name} replied on your post`
      : `${name} commented on your post`,
    link: feedLink(post.id),
  });
}

async function notifyCommentReplied({ parentCommentAuthorId, post, actor }) {
  if (!parentCommentAuthorId) return;
  const name = actor?.name || 'Someone';
  return notifyUser({
    userId: parentCommentAuthorId,
    actorId: actor?.id,
    type: 'reply',
    title: 'Someone replied to your comment',
    message: `${name} replied to your comment`,
    link: feedLink(post.id),
  });
}

async function notifyCommentLiked({ commentAuthorId, postId, actor }) {
  if (!commentAuthorId) return;
  const name = actor?.name || 'Someone';
  return notifyUser({
    userId: commentAuthorId,
    actorId: actor?.id,
    type: 'comment_like',
    title: 'Your comment was liked',
    message: `${name} liked your comment`,
    link: feedLink(postId),
  });
}

async function notifyPostReposted({ post, actor }) {
  if (!post?.authorId) return;
  const name = actor?.name || 'Someone';
  return notifyUser({
    userId: post.authorId,
    actorId: actor?.id,
    type: 'repost',
    title: 'Your post was reposted',
    message: `${name} reposted your post`,
    link: feedLink(post.id),
  });
}

async function notifyPostSaved({ post, actor }) {
  if (!post?.authorId) return;
  const name = actor?.name || 'Someone';
  return notifyUser({
    userId: post.authorId,
    actorId: actor?.id,
    type: 'save',
    title: 'Your post was saved',
    message: `${name} saved your post`,
    link: feedLink(post.id),
  });
}

async function notifyNewApplication({ posterId, actor, opportunity, applicationId }) {
  const name = actor?.name || 'Someone';
  return notifyUser({
    userId: posterId,
    actorId: actor?.id,
    type: 'opportunity',
    title: 'New application received',
    message: `${name} applied to "${opportunity.title}"`,
    link: applicationId
      ? `/opportunities/applications/received/${applicationId}`
      : '/opportunities/applications/received',
  });
}

async function notifyApplicationStatus({ applicantId, opportunity, status, actorId, applicationId }) {
  const statusMeta = {
    accepted: { title: 'Application accepted', message: `Your application for "${opportunity.title}" was accepted` },
    rejected: { title: 'Application update', message: `Your application for "${opportunity.title}" was not selected` },
    interview: { title: 'Interview invitation', message: `You were invited to interview for "${opportunity.title}"` },
    reviewed: { title: 'Application reviewed', message: `Your application for "${opportunity.title}" was reviewed` },
    shortlisted: { title: 'Application shortlisted', message: `Your application for "${opportunity.title}" was shortlisted` },
  };
  const meta = statusMeta[status] || {
    title: 'Application update',
    message: `Status updated for "${opportunity.title}"`,
  };
  return notifyUser({
    userId: applicantId,
    actorId,
    type: 'opportunity',
    title: meta.title,
    message: meta.message,
    link: applicationId
      ? `/opportunities/applications/${applicationId}`
      : '/opportunities/applications',
  });
}

async function notifyApplicationWithdrawn({ posterId, actor, opportunity, applicationId }) {
  const name = actor?.name || 'An applicant';
  return notifyUser({
    userId: posterId,
    actorId: actor?.id,
    type: 'opportunity',
    title: 'Application withdrawn',
    message: `${name} withdrew their application for "${opportunity.title}"`,
    link: applicationId
      ? `/opportunities/applications/received/${applicationId}`
      : '/opportunities/applications/received',
  });
}

async function notifyMessageReceived({ receiverId, actor, conversation, messagePreview }) {
  const name = actor?.name || 'Someone';
  return notifyUser({
    userId: receiverId,
    actorId: actor?.id,
    type: 'message',
    title: 'New message received',
    message: `${name} sent: "${messagePreview}"`,
    link: '/opportunities/messages',
  });
}

async function notifyInterviewInvitation({ applicantId, ownerName, opportunityTitle, applicationId }) {
  return notifyUser({
    userId: applicantId,
    type: 'interview',
    title: 'Interview invitation',
    message: `${ownerName} invited you to interview for "${opportunityTitle}"`,
    link: applicationId ? `/opportunities/applications/${applicationId}` : '/opportunities/applications',
  });
}

async function notifyInterviewDeclined({ ownerId, applicantName, opportunityTitle, applicationId }) {
  return notifyUser({
    userId: ownerId,
    type: 'opportunity',
    title: 'Interview declined',
    message: `${applicantName} declined the interview for "${opportunityTitle}"`,
    link: applicationId ? `/opportunities/applications/received/${applicationId}` : '/opportunities/applications/received',
  });
}

async function notifyInterviewAccepted({ ownerId, applicantName, opportunityTitle, applicationId }) {
  return notifyUser({
    userId: ownerId,
    type: 'opportunity',
    title: 'Interview accepted',
    message: `${applicantName} accepted the interview for "${opportunityTitle}"`,
    link: applicationId ? `/opportunities/applications/received/${applicationId}` : '/opportunities/applications/received',
  });
}

async function notifyApplicantDocumentUploaded({ ownerId, applicantName, opportunityTitle }) {
  return notifyUser({
    userId: ownerId,
    type: 'opportunity',
    title: 'New documents uploaded',
    message: `${applicantName} uploaded new documents for "${opportunityTitle}"`,
    link: '/opportunities/applications/received',
  });
}

async function notifyAdminReportedConversation({ adminId, reporterName, conversationId, reason }) {
  return notifyUser({
    userId: adminId,
    type: 'system',
    title: 'Conversation reported',
    message: `${reporterName} reported a conversation: ${reason}`,
    link: `/admin?tab=conversations&id=${conversationId}`,
  });
}

module.exports = {
  notifyUser,
  notifyPostLiked,
  notifyPostCommented,
  notifyCommentReplied,
  notifyCommentLiked,
  notifyPostReposted,
  notifyPostSaved,
  notifyNewApplication,
  notifyApplicationStatus,
  notifyApplicationWithdrawn,
  notifyMessageReceived,
  notifyInterviewInvitation,
  notifyInterviewDeclined,
  notifyInterviewAccepted,
  notifyApplicantDocumentUploaded,
  notifyAdminReportedConversation,
};
