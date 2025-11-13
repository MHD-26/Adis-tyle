const produits = [
    {
        id:1 , name:"robe", price:2000,stock:20 , desc :"belle robe" , image:'image/robe.jpeg'
    },
    {
        id:2 , name:"sac", price:2000,stock:20 , desc :"beau sac" , image:'image/sac a main blanc.jpeg'
    }, 
    {
        id:3 , name:"tissu", price:2000,stock:20 , desc :"beau tissu" , image:'image/brode.png'
    },
    {
        id:4 , name:"robe", price:2000,stock:20 , desc :"belle robe" , image:'image/robe.jpeg'
    },
    {
        id:5 , name:"sac", price:2000,stock:20 , desc :"beau sac" , image:'image/sac a main blanc.jpeg'
    }, 
    {
        id:6 , name:"tissu", price:2000,stock:20 , desc :"beau tissu" , image:'image/brode.png'
    } 
 

]

const produit = document.querySelector('#produit')
const nom = document.querySelector('#nom')
const adresse = document.querySelector('#adresse')
const telephone = document.querySelector('#telephone')
const spanNom = document.querySelector('#spanNom')
const information = document.querySelector('#information')


function load(){
    let html = `<div class="row"> `
    produits.forEach(element => {
        html += `<div class="col-4 mb-2">
                <div class="card" style="width: 18rem;">
                    <img src="${element.image}" class="card-img-top" alt="...">
                    <div class="card-body"
                        <p class="card-title"> ${element.desc} </p>
                        <h5 class="card-title"> ${element.price} €</h5>
                        <h3 class="card-title">Libellé :  ${element.name} </h3>
                        <h5 class="card-title"> stock : ${element.stock} </h5>
                        <input type="number" class="input${element.id}" style="width:50px;" value="1" min="1" max="20" > 
                        <a href="#" class="btn btn-primary" onClick="ajoutPanier(${element.id})">Ajouter au panier</a>
                    </div>
                </div>
            </div> 
        `
        });
        html +="</div>"
        produit.innerHTML += html
}

let somme = 0
let quantity = 0

function ajoutPanier(e) {
    produits.forEach(element => {
        let input = document.querySelector(".input"+element.id)
        if (e===element.id) {
            quantity = input.value
            somme = quantity*element.price 
            element.stock = element.stock - quantity
             console.log(`stock : ${element.stock} - somme : ${somme} - prix : ${element.price} `);


        }
        
    });
}

function btnValide(e) {
    e.preventDefault()
    if (nom.value.trim()==="") {
        console.log("hello");
        spanNom.removeAttribute('hidden') 
        nom.style.borderColor = 'red'       
    }    
    else{
        spanNom.setAttribute('hidden','hidden')
        nom.style.borderColor = 'green'       
    }
    
    let info = `
        <h2> ${nom.value} </h2>
        <h2> ${adresse.value} </h2>
        <h2> ${telephone.value} </h2>
    `
    information.innerHTML = info
    nom.value = ""
    adresse.value = ""
    telephone.value = ""
}
