import { c as Selection, l as root } from "./d3+[...].mjs";
//#region node_modules/d3-selection/src/select.js
function select_default(selector) {
	return typeof selector === "string" ? new Selection([[document.querySelector(selector)]], [document.documentElement]) : new Selection([[selector]], root);
}
//#endregion
export { select_default as t };
