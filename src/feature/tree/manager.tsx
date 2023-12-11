import { Dispatch, useReducer, useState } from "react";
import { TreeNode, initialValues } from "../../domain/tree-node-model"
import { generateId } from "../../utils/generate-id";

type TreeNodeComponentProps = {
	parent?: TreeNode;
	node: TreeNode;
	index: number;
	dispatch: Dispatch<TreeAction>;
	idInEdit?: string;
}

const TreeNodeViewer = ({ parent, node, index, dispatch }: TreeNodeComponentProps) => {
	return (
		<>
			<span>{node.name}</span>
			<button onClick={() => dispatch({ type: "add-item", payload: { index: -1, parent: node } })}>+ child</button>
			{parent ? <button onClick={() => dispatch({ type: "add-item", payload: { index, parent } })}>+ sibling</button> : null}
			{parent ? <button onClick={() => dispatch({ type: "remove-item", payload: { id: node.id, parent } })}>-delete</button> : null}
			{parent ? <button onClick={() => dispatch({ type: "edit-set-item", payload: { nodeId: node.id } })}>edit</button> : null}
		</>
	)
}

const TreeNodeEditor = ({ parent, node, dispatch }: TreeNodeComponentProps) => {
	const [name, setName] = useState(node.name);
	const updatedNode = { ...node, name }
	return (
		<>
			<input onChange={(e) => setName(e.target.value)} value={name} />
			{parent ? <button onClick={() => dispatch({ type: "edit-apply", payload: { node: updatedNode, parent } })}>ok</button> : null}
			{parent ? <button onClick={() => dispatch({ type: "edit-cancel" })}>cancel</button> : null}
		</>
	)
}

const TreeNodeComponent = (props: TreeNodeComponentProps) => {
	const { node, dispatch, idInEdit } = props;
	const { items } = node;
	return (<li>
		{!(idInEdit === node.id) ? <TreeNodeViewer {...props} /> : null}
		{idInEdit === node.id ? <TreeNodeEditor {...props} /> : null}
		<ol>
			{items ? items.map((item, index) => <TreeNodeComponent key={item.id} parent={node} node={item} index={index} idInEdit={idInEdit} dispatch={dispatch} />) : null}
		</ol>
	</li>)
}




function mutateTree(root: TreeNode, nodeIdToUpdate: string, newItems: TreeNode[]): TreeNode {
	function updateNodes(node: TreeNode,) {
		if (node.id === nodeIdToUpdate) {
			return { ...node, id: node.id, items: newItems }
		}

		if (node.items) {
			node.items = node.items.map(updateNodes);
		}
		return node;
	}
	return updateNodes(root);
}

type TreeState = {
	root: TreeNode,
	idInEdit?: string,
}

type TreeAction =
	| { type: "add-item", payload: { parent: TreeNode, index: number } }
	| { type: "remove-item", payload: { parent: TreeNode, id: string } }
	| { type: "edit-set-item", payload: { nodeId: string } }
	| { type: "edit-apply", payload: { parent: TreeNode, node: TreeNode, } }
	| { type: "edit-cancel" }


function reducer(state: TreeState, action: TreeAction): TreeState {
	switch (action.type) {

		case "add-item": {
			const { index, parent } = action.payload;
			let { items } = parent;
			if (!items) items = [];
			let newItems = [];
			if (index === -1) {
				newItems = [
					...items,
					{ id: generateId(), name: "my name is?" },
				];
			} else {
				newItems = [
					...items.slice(0, index + 1),
					{ id: generateId(), name: "my name is?" },
					...items.slice(index + 1),
				]
			}
			const root = mutateTree(state.root, parent.id, newItems);
			return { ...state, root, idInEdit: undefined }
		}

		case "remove-item": {
			const { id, parent } = action.payload;
			const { items } = parent;
			if (!items) return state;
			let newItems = items.filter(item => item.id !== id);
			const root = mutateTree(state.root, parent.id, newItems);
			return { ...state, root, idInEdit: undefined }
		}

		case "edit-set-item": {
			const { nodeId } = action.payload;
			return { ...state, idInEdit: nodeId }
		}

		case "edit-apply": {
			const { node, parent } = action.payload;
			const { items } = parent;
			if (!items) return state;
			const newItems = items.map(item => {
				if (item.id === node.id) {
					return node;
				}
				return item;
			});
			const root = mutateTree(state.root, parent.id, newItems);
			return { ...state, root, idInEdit: undefined }
		}

		case "edit-cancel": {
			return { ...state, idInEdit: undefined }
		}

		default:
			return state;
	}
}

const TreeManager = () => {
	const [state, dispatch] = useReducer(reducer, { root: initialValues });
	return (
		<>
			<h1>Tree manager</h1>
			<TreeNodeComponent node={state.root} index={0} dispatch={dispatch} idInEdit={state.idInEdit} />
		</>
	)
}

export { TreeManager }
