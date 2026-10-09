export const FAMILIES = [
 {id:'jaime-vio',name:'Jaime-Vio',people:5,adults:2,members:'Jaime y Vio · Jaime, Mateo y Gonzalo'},
 {id:'camba-ceci',name:'Camba-Ceci',people:4,adults:2,members:'Álvaro y Ceci · Adrián y Lucía'},
 {id:'sanjo-anita',name:'Sanjo-Anita',people:4,adults:2,members:'Anita y Álvaro · Pablo y Diego'},
 {id:'pedro-marta',name:'Pedro-Marta',people:2,adults:2,members:'Pedro y Marta · Sin niños'},
 {id:'polo-laura',name:'Polo-Laura',people:4,adults:2,members:'Fer Polo y Laura · Martina y Dani'},
 {id:'felix-ines',name:'Felix-Ines',people:4,adults:2,members:'Félix e Inés · Félix y Marco'},
 {id:'rafa-maria',name:'Rafa-Maria',people:3,adults:2,members:'Rafa y María · Inés'}
];
export const initialState=()=>({families:structuredClone(FAMILIES),expenses:[],payments:[]});
