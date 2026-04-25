'use server'

import { addTransaction as _addTransaction } from "./commands/add-transaction"
import { deleteTransaction as _deleteTransaction } from "./commands/delete-transaction"
import { editTransaction as _editTransaction } from "./commands/edit-transaction"
import { getUserAssets as _getUserAssets } from "./services/asset-lookup"

export async function addTransaction(...args: Parameters<typeof _addTransaction>) {
  return _addTransaction(...args)
}

export async function deleteTransaction(...args: Parameters<typeof _deleteTransaction>) {
  return _deleteTransaction(...args)
}

export async function editTransaction(...args: Parameters<typeof _editTransaction>) {
  return _editTransaction(...args)
}

export async function getUserAssets(...args: Parameters<typeof _getUserAssets>) {
  return _getUserAssets(...args)
}
