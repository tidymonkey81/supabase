import { GuideTemplate, newEditLink } from '~/features/docs/GuidesMdx.template'
import {
  generateAiPromptMetadata,
  generateAiPromptsStaticParams,
  getAiPrompt,
} from './AiPrompts.utils'

export const dynamicParams = false

export default async function AiPromptsPage({ params: { slug } }: { params: { slug: string } }) {
  const { heading, content } = await getAiPrompt(slug)

  return (
    <GuideTemplate
      meta={{ title: `API Prompt: ${heading}` }}
      content={content}
      editLink={newEditLink(`supabase/supabase/blob/master/examples/prompts/${slug}.md`)}
    />
  )
}

export const generateMetadata = generateAiPromptMetadata
export const generateStaticParams = generateAiPromptsStaticParams
