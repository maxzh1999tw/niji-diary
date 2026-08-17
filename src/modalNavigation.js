export const MODAL_HISTORY_KEY = '__nijiModalStack'

let modalTokenSequence = 0

export function getModalHistoryStack(state) {
  return Array.isArray(state?.[MODAL_HISTORY_KEY])
    ? state[MODAL_HISTORY_KEY].filter((token) => typeof token === 'string' && token)
    : []
}

export function createModalHistoryToken(id = 'modal') {
  modalTokenSequence += 1
  return `${String(id)}:${modalTokenSequence}`
}

export function appendModalHistoryToken(state, token) {
  if (!token) return state ?? null
  return {
    ...(state && typeof state === 'object' ? state : {}),
    [MODAL_HISTORY_KEY]: [...getModalHistoryStack(state), token],
  }
}

export function removeModalHistoryToken(state, token) {
  const stack = getModalHistoryStack(state)
  if (!stack.includes(token)) return state ?? null
  const nextStack = stack.filter((entry) => entry !== token)
  const nextState = { ...(state && typeof state === 'object' ? state : {}) }
  if (nextStack.length) nextState[MODAL_HISTORY_KEY] = nextStack
  else delete nextState[MODAL_HISTORY_KEY]
  return nextState
}

export function clearModalHistoryState(state) {
  if (!getModalHistoryStack(state).length) return state ?? null
  const nextState = { ...(state && typeof state === 'object' ? state : {}) }
  delete nextState[MODAL_HISTORY_KEY]
  return nextState
}
