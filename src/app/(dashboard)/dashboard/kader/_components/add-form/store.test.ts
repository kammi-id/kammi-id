import { afterEach, describe, expect, test } from 'bun:test'
import {
  isEditModeStore,
  editedRowsStore,
  enterEditMode,
  exitEditMode,
  setRowEdit,
  clearRowEdits
} from './store'

describe('edit-mode store', () => {
  afterEach(() => {
    exitEditMode()
    clearRowEdits()
  })

  test('enterEditMode/exitEditMode toggle isEditModeStore', () => {
    expect(isEditModeStore.get()).toBe(false)
    enterEditMode()
    expect(isEditModeStore.get()).toBe(true)
    exitEditMode()
    expect(isEditModeStore.get()).toBe(false)
  })

  test('setRowEdit merges partial changes per memberId', () => {
    setRowEdit('member-1', { name: 'New Name' })
    setRowEdit('member-1', { phone: '0812' })
    expect(editedRowsStore.get()['member-1']).toEqual({
      name: 'New Name',
      phone: '0812'
    })
  })

  test('clearRowEdits resets the map', () => {
    setRowEdit('member-1', { name: 'New Name' })
    clearRowEdits()
    expect(editedRowsStore.get()).toEqual({})
  })
})
