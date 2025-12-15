import { existsSync, readdirSync } from "fs";

const VALID_PROJECT_DIRECTORY = [
  ".DS_Store",
  ".git",
  ".gitkeep",
  ".gitattributes",
  ".gitignore",
  ".gitlab-ci.yml",
  ".hg",
  ".hgcheck",
  ".hgignore",
  ".idea",
  ".npmignore",
  ".travis.yml",
  ".yarn",
  ".yarnrc.yml",
  "docs",
  "LICENSE",
  "mkdocs.yml",
  "Thumbs.db",
  /\.iml$/,
  /^npm-debug\.log/,
  /^yarn-debug\.log/,
  /^yarn-error\.log/,
];

/**
 * Determine whether a directory is "empty" for project creation purposes.
 *
 * @param {string} dirPath - The path to the directory to check.
 * @returns {boolean} True if the directory does not exist or contains no conflicting entries; false otherwise.
 */
export function isEmpty(dirPath) {
  if (!existsSync(dirPath)) {
    return true;
  }

  const conflicts = readdirSync(dirPath).filter((content) => {
    return !VALID_PROJECT_DIRECTORY.some((safeContent) => {
      return typeof safeContent === "string"
        ? content === safeContent
        : safeContent.test(content);
    });
  });

  return conflicts.length === 0;
}
