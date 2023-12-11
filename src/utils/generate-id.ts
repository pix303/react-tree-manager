export function generateId(): string {
	const timestamp = new Date().getTime();
	const randomStamp = Math.floor(Math.random() * 123456789);
	return `${timestamp}-${randomStamp}`;
}

const names = [
	"John",
	"Jim",
	"Steve",
	"Alice",
	"Alison",
	"Sophie",
];

export function generateName(): string {
	const randomIndex = Math.ceil(Math.random() * names.length - 1);
	return names[randomIndex];
}
