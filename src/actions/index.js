import { getContext } from './context.js'
import gitAction from './git.js'
import installAction from './install.js'
import nextStepsAction from './next-steps.js'
import projectNameAction from './project-name.js'
import selectTemplateAction from './select-template.js'
import templateAction from './template.js'

export default async function actions(projectName, options) {
  const context = getContext(projectName, options)
  await projectNameAction(context)
  await selectTemplateAction(context)
  await templateAction(context)
  await installAction(context)
  await gitAction(context)
  nextStepsAction(context)
}
