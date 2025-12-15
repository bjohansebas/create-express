import { isEmpty } from "../utils/os.js";
import validate from "validate-npm-package-name";
import { input } from "@inquirer/prompts";
import { resolve } from "path";

export default async function projectNameAction(context) {
  let validation = validate(context.projectName || "");
  if (context.projectName == null) {
    const projectName = await input({
      message: "What is the name of your project?",
      default: "my-express-server",
    });

    context.projectName = projectName;
  }

  let empty = isEmpty(context.projectName);

  while (empty === false || validation.validForOldPackages === false) {
    if (empty === false) {
      console.log(
        `The directory "${context.projectName}" is not empty. Please choose a different project name.`
      );
    }
    if (validation.validForOldPackages === false) {
      console.log(
        `The project name "${context.projectName}" is not a valid npm package name`
      );
    }
    const projectName = await input({
      message: "What is the name of your project?",
      default: "my-express-server",
    });

    context.projectName = projectName;
    empty = isEmpty(context.projectName);
    validation = validate(context.projectName);
  }

  context.cwd = resolve(context.projectName.trim());
  return context.projectName;
}
