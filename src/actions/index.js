import composeAction from './compose.js'
import { getContext } from './context.js'
import gitAction from './git.js'
import installAction from './install.js'
import nextStepsAction from './next-steps.js'
import projectNameAction from './project-name.js'
import selectFeaturesAction from './select-features.js'

export default async function actions(projectName, options) {
  const context = getContext(projectName, options)
  await projectNameAction(context)
  await selectFeaturesAction(context)
  await composeAction(context)
  await installAction(context)
  await gitAction(context)
  nextStepsAction(context)
}
