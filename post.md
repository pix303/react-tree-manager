Recentemente mi sono trovato a dover editare una struttura che presentava dai 3 ai 4 livelli di annidamento: entità che contenevano liste di altre entità anche se non esplicitamente in ricorsione. La migliore soluzione che ho trovato finora è quella di utilizzare:
- un'interfaccia che rappresenta il nodo dell'albero
- useReducer come state management
- una funzione ricorsiva per mutare l'intero albero

## Treeitem: il tipo per rappresentare il nodo
Questa l'interfaccia che rappresenta il nodo

```typescript
export type TreeNode = {
	id: string,
	name: string,
	items?: TreeNode[],
}

```

In questo caso per semplificare ho già previsto la prop _name_ che sarà l'unico dato che andremo ad editare ma in generale TreeItem è da usare come **estensione** per le entità che saranno sicuramente più complesse.


## State management con useReducer

L'hook useReducer può essere il punto di partenza per poter gestire le azioni/eventi e i cambi di stato conseguenti, ma si potrebbero valutare state management più evoluti.
Vediamo la definizione delle azioni base:

```typescript
type TreeAction =
	| { type: "add-item", payload: { parent: TreeNode, index: number } }
	| { type: "remove-item", payload: { parent: TreeNode, id: string } }
	| { type: "edit-set-item", payload: { nodeId: string } }
	| { type: "edit-apply", payload: { parent: TreeNode, node: TreeNode, } }
	| { type: "edit-cancel" }
```

L'azione di editing si compone di almeno 2 parti: l'attivazione alla modifica del nodo e le conseguenti azioni di conferma o annullamento.
Per quanto riguarda il modello dello stato come punto di partenza basterà 

```typescript
type TreeState = {
	root: TreeNode,
	idInEdit?: string,
}
```

Lo stato quindi rappresenterà l'intero albero che verrà mutato in conseguenza delle azioni di aggiunta, rimozione o modifca dei nodi e l'eventuale id del nodo in modifica.

## Funzione di mutazione dell'albero
La funzione che si occuperà di restiture il nuovo albero utilizzerà la ricorsione per la ricerca e sostituzione dei figli del nodo che stiamo modificando. 
Anche nel caso di edit di un singolo nodo andremo comunque a modificare i figli del nodo padre di quest'ultimo.


```typescript
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
```


## Aggiunta di un nuovo nodo
Questa azione si prefigge di gestire due casi
- aggiunta di un nodo figlio a partire dal nodo padre
- aggiunta di un nodo fratello a partire dal nodo stesso

L'indice, in questo esempio, viene passato solo in caso di aggiunta di un nodo fratello

```typescript
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
```

## Rimozione di un nodo
Questa azione viene sempre invocata dal nodo stesso che vogliamo rimuovere

```typescript
case "remove-item": {
	const { id, parent } = action.payload;
	const { items } = parent;
	if (!items) return state;
	let newItems = items.filter(item => item.id !== id);
	const root = mutateTree(state.root, parent.id, newItems);
	return { ...state, root, idInEdit: undefined }
}
```

## Le azioni di modifica nodo
Le azioni di set e cancel sono molto semplici in quanto vanno ad agire sulla prop dello stato che tiene traccia dell'id che stiamo modificando.
L'azione di conferma modifica invece prende in carico i dati raccolti dal form di modifica e li va ad applicare al nodo con id precedentemente tracciato.

```typescript
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
```

## Componenti di renderizzazione nodi albero
Il componente di renderizzazione del signolo nodo sarà rappresentato da due diversi componenti a seconda se questo è in modalità modifica o meno, ma in entrambi i casi avranno come prop

```typescript
type TreeNodeComponentProps = {
	parent?: TreeNode;
	node: TreeNode;
	index: number;
	dispatch: Dispatch<TreeAction>;
	idInEdit?: string;
}
```

Da notare che il parent potrebbe essere non definito per il caso del nodo root, e il _prop-drilling_ di dispatch, per lanciare le azioni a qualsiasi livello di annidamento, e id nodo per la modifica dello stato del nodo stesso.


```typescript
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

```

Per la soluzione completa trovate il codice in questo repository. 
E voi quali soluzioni avete addottato per gestire un caso simile?
