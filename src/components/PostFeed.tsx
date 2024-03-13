// import { FC } from 'react'
// import { ExtendedPost } from '@/types/db'

// interface PostFeedProps {
//   initialPosts: ExtendedPost[]
//   subredditName?: string
// }

// const PostFeed: FC<PostFeedProps> = ({  }) => {
//   return (
//     <div>PostFeed</div>
//   )
// }
 
// export default PostFeed;


'use client'


import { INFINITE_SCROLL_PAGINATION_RESULTS } from '@/config'
import { ExtendedPost } from '@/types/db'
import { useIntersection } from '@mantine/hooks'
import { useInfiniteQuery } from '@tanstack/react-query'
import axios from 'axios'
import { Loader2 } from 'lucide-react'
import { FC, useEffect, useRef } from 'react'
import Post from './Post'
import { useSession } from 'next-auth/react'

interface PostFeedProps {
  initialPosts: ExtendedPost[]
  subredditName?: string
}

const PostFeed: FC<PostFeedProps> = ({ initialPosts, subredditName }) => {
  const lastPostRef = useRef<HTMLElement>(null)

  //한번에 모두 불러오지않고 마지막 포스트가 뷰포트를 (넘어가면) 그때마다 (하나씩) 로드
  const { ref, entry } = useIntersection({
    root: lastPostRef.current,
    threshold: 1,
  })

  //클라이언트 사이드에서 세션을 처리하기  
  const { data: session } = useSession()

  //use hook : Fetching
  const { data, fetchNextPage, isFetchingNextPage } = useInfiniteQuery(
    ['infinite-query'],
    async ({ pageParam = 1 }) => { //디폴트(시작) 페이지 
      const query =
        `/api/posts?limit=${INFINITE_SCROLL_PAGINATION_RESULTS}&page=${pageParam}` +
        (!!subredditName ? `&subredditName=${subredditName}` : '')

      const { data } = await axios.get(query)
      return data as ExtendedPost[]
    },
    //첫 페이지를 시작으로 하나씩 추가 
    {
      getNextPageParam: (_, pages) => {
        return pages.length + 1
      },
      initialData: { pages: [initialPosts], pageParams: [1] },
    }
  )

  useEffect(() => {
    if (entry?.isIntersecting) {
      // Load more posts when the last post comes into view 
      fetchNextPage()  // <- <li key={post.id} ref={ref}>
    }
  }, [entry, fetchNextPage])

  const posts = data?.pages.flatMap((page) => page) ?? initialPosts

  return (
    <ul className='flex flex-col col-span-2 space-y-6'> 
      {posts.map((post, index) => {
        const votesAmt = post.votes.reduce((acc, vote) => {
          if (vote.type === 'UP') return acc + 1
          if (vote.type === 'DOWN') return acc - 1
          return acc
        }, 0)

        // ...=useSession()
        const currentVote = post.votes.find(
          (vote) => vote.userId === session?.user.id
        )

        if (index === posts.length - 1) {
          // Add a ref to the last post !! in the list 
          return (
            <li key={post.id} ref={ref}>
              <Post
                post={post}
                commentAmt={post.comments.length}
                subredditName={post.subreddit.name}
                votesAmt={votesAmt}
                currentVote={currentVote}
              />
            </li>
          )
        } else {
          return (
            <Post
              key={post.id}
              post={post}
              commentAmt={post.comments.length}
              subredditName={post.subreddit.name}
              votesAmt={votesAmt}
              currentVote={currentVote}
            /> 
          )
        }
      })}

      {isFetchingNextPage && (
        <li className='flex justify-center'>
          <Loader2 className='w-6 h-6 text-zinc-500 animate-spin' />
        </li>
      )}
    </ul>
  )
}

export default PostFeed
