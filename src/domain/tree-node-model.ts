import { generateId } from "../utils/generate-id"

export type TreeNode = {
	id: string,
	name: string,
	items?: TreeNode[],
}


export const initialValues: TreeNode = {
	id: generateId(),
	name: "root",
}
