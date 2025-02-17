import { keyboard, Key, mouse, screen, sleep } from "@nut-tree-fork/nut-js"
import Tesseract from "tesseract.js"
import stringSimilarity from "string-similarity"
import { unlink } from "fs"

import setup from "./setup.json"
import triviaQuestions from "./triviaQuestions.json"

keyboard.config.autoDelayMs = 0

const startDelay = setup.delayToStart * 1000
const interactionDelay = setup.delayInEachInteraction * 1000
const reopenNpcDelay = setup.delayToReopenNpc * 1000

async function trivia() {
  const questions = triviaQuestions.map(({ question }) => question)

  await sleep(startDelay)

  for (let index = 0; index < setup.questions; index++) {
    // NPC interaction
    await keyboard.pressKey(Key.LeftShift)
    await mouse.setPosition(setup.npcPosition)
    await mouse.leftClick()
    await mouse.leftClick()
    await keyboard.releaseKey(Key.LeftShift)
    await sleep(interactionDelay)

    // NPC first confirm
    await mouse.setPosition(setup.answersPositions[0])
    await mouse.leftClick()
    await sleep(interactionDelay)

    // NPC second confirm
    await mouse.setPosition(setup.answersPositions[0])
    await mouse.leftClick()
    await sleep(reopenNpcDelay)

    // NPC interaction
    await keyboard.pressKey(Key.LeftShift)
    await mouse.setPosition(setup.npcPosition)
    await mouse.leftClick()
    await mouse.leftClick()
    await keyboard.releaseKey(Key.LeftShift)
    await sleep(interactionDelay)

    // NPC interaction to answer question
    await mouse.setPosition(setup.answersPositions[0])
    await mouse.leftClick()
    await sleep(interactionDelay)

    // Print question area
    const image = await screen.captureRegion("triviaQuestion", {
      ...setup.questionArea,
      area: () => 0
    })

    // Analyze image
    const { data } = await Tesseract.recognize(image)

    const cleanedText = data.text
      .replace(/\n/g, " ")
      .replace(/\s+/g, " ")
      .trim()

    // Get best match
    const { ratings, bestMatchIndex } = stringSimilarity.findBestMatch(
      cleanedText,
      questions
    )

    const bestRating = ratings[bestMatchIndex].rating

    // Report question out of base
    if (bestRating < 0.5) {
      console.log(
        "Pergunta nao encontrada na base, favor adicionar:",
        cleanedText
      )

      return
    }

    const correctIndex = triviaQuestions[bestMatchIndex].correctIndex
    const answer = setup.answersPositions[correctIndex]

    // Answer question
    await mouse.setPosition(answer)
    await mouse.leftClick()
    await sleep(interactionDelay)
  }

  // Delete question print
  unlink("./triviaQuestion.png", () => {})
}

trivia().catch(error => console.error(error))
