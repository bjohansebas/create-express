import { getContext } from './context.js'
import projectNameAction from './project-name.js'

export default async function actions(projectName, options) {
  const context = getContext(projectName, options)
  await projectNameAction(context)
}
