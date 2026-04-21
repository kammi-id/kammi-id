import { expect, test, describe, mock, beforeAll, afterAll } from "bun:test";
import { getRandomAlphanumeric, generatePassword } from "./user";
import { writeFileSync, unlinkSync, existsSync, renameSync } from "node:fs";
import { join } from "node:path";

describe("User Utils", () => {
  const dictionaryPath = join(process.cwd(), "dictionary.txt");
  const backupPath = join(process.cwd(), "dictionary.txt.bak");
  const testWords = "apple,banana,cherry";

  beforeAll(() => {
    // Backup existing dictionary if it exists
    if (existsSync(dictionaryPath)) {
      renameSync(dictionaryPath, backupPath);
    }
    // Create a controlled dictionary for testing
    writeFileSync(dictionaryPath, testWords);
  });

  afterAll(() => {
    // Clean up test dictionary
    if (existsSync(dictionaryPath)) {
      unlinkSync(dictionaryPath);
    }
    // Restore backup
    if (existsSync(backupPath)) {
      renameSync(backupPath, dictionaryPath);
    }
  });

  test("getRandomAlphanumeric returns correct length", () => {
    const res = getRandomAlphanumeric(10);
    expect(res).toHaveLength(10);
    expect(res).toMatch(/^[a-z0-9]+$/);
  });

  test("generatePassword follows pattern [word]-[random]", () => {
    const password = generatePassword();
    // Pattern: [word]-[5 random alphanumeric]
    // Word from testWords (e.g., apple, banana, cherry)
    expect(password).toMatch(/^[a-zA-Z]+-[a-z0-9]{5}$/);
    
    const [word, random] = password.split("-");
    expect(testWords.split(",")).toContain(word);
    expect(random).toHaveLength(5);
  });
});
