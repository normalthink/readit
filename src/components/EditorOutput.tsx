'use client'

import CustomCodeRenderer from '@/components/renderers/CustomCodeRenderer'
import CustomImageRenderer from '@/components/renderers/CustomImageRenderer'
import { FC } from 'react'
import dynamic from 'next/dynamic'

const Output = dynamic(
  async () => (await import('editorjs-react-renderer')).default,
  { ssr: false }
)

interface EditorOutputProps {
  content: any
}

const renderers = {
  image: CustomImageRenderer,
  code: CustomCodeRenderer,
}

const style = {
  paragraph: {
    fontSize: '0.875rem',
    lineHeight: '1.25rem',
  },
}

const EditorOutput: FC<EditorOutputProps> = ({ content }) => {
  return (
    //*타입스크립트 에러 제거하는 어노테이션 제거 
    <Output
      style={style}
      className='text-sm'
      renderers={renderers}  //<- renderers, style
      data={content}
    />
  )
}

export default EditorOutput
