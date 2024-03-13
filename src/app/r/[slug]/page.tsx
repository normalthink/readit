// import React, { FC } from 'react'
// interface pageProps {}

// const page: FC<pageProps> = ({  }) => {
//   return (
//     <div> page </div>
//   )
// }

// export default page;


import MiniCreatePost from '@/components/MiniCreatePost'
import PostFeed from '@/components/PostFeed'
import { INFINITE_SCROLL_PAGINATION_RESULTS } from '@/config'
import { getAuthSession } from '@/lib/auth'
import { db } from '@/lib/db'
import { notFound } from 'next/navigation'


interface PageProps {
  params: {
    slug: string
  }
}

  //nextjs의 dynamic routes has not changed form the approach. we have in this page. 
  //it's the same thing. we can literally copy the props like this ({ params }: PageProps).
  //the slug params are passed the same way into this component just like with the other page.tsx 
  //becase we're still inside of the dynamic routes
const page = async ({ params }: PageProps) => {
  const { slug } = params

  //MiniCreatePost에서 사용할 용도
  const session = await getAuthSession()

  //이후 redis를 활용해서 대형 조인에 대한 퍼포먼스 개선이 필요한 부분
  const subreddit = await db.subreddit.findFirst({
    where: { name: slug },
    include: {
      posts: {
        include: {
          author: true,
          votes: true,
          comments: true,
          subreddit: true,
        },
        //무한스크롤 단위 -src 글로벌 구성에서 몇 개를 참조할 것인지 선언 
        take: INFINITE_SCROLL_PAGINATION_RESULTS, 
      },
    },
  })

  if (!subreddit) return notFound()

  return (
    <>
      <h1 className='font-bold text-3xl md:text-4xl h-14'>
        r/{subreddit.name}
      </h1>
      <MiniCreatePost session={session} />

      <PostFeed initialPosts={subreddit.posts} subredditName={subreddit.name} />
    </>
  )
}

export default page
