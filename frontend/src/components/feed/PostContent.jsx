import PostMediaPlayer from './PostMediaPlayer'

/** Renders post media: videos, music, and images */
export default function PostContent({ post }) {
  const videos = post.videos || []
  const images = post.images || []
  const audioTrack = post.audioTrack || null

  if (!videos.length && !images.length && !audioTrack?.src) return null

  return (
    <PostMediaPlayer
      videos={videos}
      images={images}
      audioTrack={audioTrack}
      postId={post.id}
      className="mt-4"
    />
  )
}
