import { getAuthSession } from '@/lib/auth'
import type { Post, Vote } from '@prisma/client'
import { notFound } from 'next/navigation'
import PostVoteClient from './PostVoteClient'

interface PostVoteServerProps {
  postId: string
  initialVotesAmt?: number
  initialVote?: Vote['type'] | null
  getData?: () => Promise<(Post & { votes: Vote[] }) | null>
}

/**
 * We split the PostVotes into a client and a server component to allow for dynamic data
 * fetching inside of this component, allowing for faster page loads via suspense streaming.
 * We also have to option to fetch this info on a page-level and pass it in.
 *
 * PostVotes를 클라이언트와 서버 컴포넌트로 분리하여 
 * 이 컴포넌트 내부에서 동적 데이터를 가져올 수 있도록 하여 
 * 서스펜스 스트리밍을 통해 페이지를 더 빠르게 로드할 수 있도록 했습니다. 
 * 또한 페이지 수준에서 이 정보를 가져와서 전달할 수 있는 옵션도 필요합니다.
 * 
 */


const PostVoteServer = async ({
  postId,
  initialVotesAmt,
  initialVote,
  getData,
}: PostVoteServerProps) => {
  const session = await getAuthSession()

  //we're going to default it to undefined as if the user has not voted yet and the reason we're declarig these  
  let _votesAmt: number = 0
  let _currentVote: Vote['type'] | null | undefined = undefined

  // as let is to mutate them 
  if (getData) {
    // fetch data in component
    const post = await getData()
    if (!post) return notFound()

    _votesAmt = post.votes.reduce((acc, vote) => {
      if (vote.type === 'UP') return acc + 1
      if (vote.type === 'DOWN') return acc - 1
      return acc
    }, 0)

    _currentVote = post.votes.find(
      (vote) => vote.userId === session?.user?.id
    )?.type
  } else {
    // passed as props
    _votesAmt = initialVotesAmt!
    _currentVote = initialVote
  }

  return (
    <PostVoteClient
      postId={postId}
      initialVotesAmt={_votesAmt}
      initialVote={_currentVote}
    />
  )
}

export default PostVoteServer
