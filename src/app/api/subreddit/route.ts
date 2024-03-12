import { getAuthSession } from '@/lib/auth'
import { db } from '@/lib/db'
import { SubredditValidator } from '@/lib/validators/subreddit'
import { z } from 'zod'

export async function POST(req: Request) {
  try {
    //인증된 세션 사용자를 받을 변수를 선언한다 
    const session = await getAuthSession()

    if (!session?.user) {
      //session에 사용자가 없으면 승인되지않음 
      return new Response('Unauthorized', { status: 401 }) 
    }

    //(승인되어) 게시물에 접근 시작 
    const body = await req.json()
    const { name } = SubredditValidator.parse(body)

    // check if subreddit already exists
    const subredditExists = await db.subreddit.findFirst({
      where: {
        name,
      },
    })

    if (subredditExists) {
      //동일 이름에 대한 충돌 메시지 
      return new Response('Subreddit already exists', { status: 409 })
    }

    // create subreddit and associate it with the user
    const subreddit = await db.subreddit.create({
      data: {
        name,
        creatorId: session.user.id,
      },
    })

    // creator also has to be subscribed
    await db.subscription.create({
      data: {
        userId: session.user.id,
        subredditId: subreddit.id,
      },
    })

    return new Response(subreddit.name)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new Response(error.message, { status: 422 })
    }

    return new Response('Could not create subreddit', { status: 500 })
  }
}
