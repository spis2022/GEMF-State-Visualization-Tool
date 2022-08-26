// Global Variables
let Graph;
let inputCounter = 0;
let data = {
    "nodes": [],
    "links": []
}
let step = 1;

// On Load
window.onload = function() {
    createNewInput();

    // Graph Javascript
    Graph = ForceGraph()
        (document.getElementById('graph'))
        .graphData(data)
        .nodeId('id')
        .nodeVal('val')
        .nodeLabel('name')
        .nodeAutoColorBy('group')
        .linkSource('source')
        .linkTarget('target')
        .width(window.innerWidth * .7)
        .height(window.innerHeight)
        .maxZoom(5)
        .minZoom(1)
}

// Form Javascript

function createNewInput() {
    inputCounter++;

    const inptGroup = document.createElement("div");
    inptGroup.id = "input-group";
    inptGroup.className = "input-group mb-3 w-100";

    const inpt = document.createElement("input");
    inpt.type = 'text';
    inpt.id = 's-1-input-' + inputCounter;
    inpt.className = 'form-control';
    inpt.placeholder = 'State Name';
    inpt.ariaLabel = 'State Name';

    const button = document.createElement("button");
    button.className = "btn btn-danger";
    button.type = "button";
    button.id = "button-addon-" + inputCounter;
    button.count = inputCounter;
    const node = document.createTextNode("Delete");
    button.appendChild(node);

    button.addEventListener('click', deleteInput);

    function deleteInput(e) {
        // make sure that we're not deleting the only input left
        if (button.count !== inputCounter) {
            inptGroup.remove();
            data.nodes = data.nodes.filter(node => node.id != button.count);
            Graph.graphData(data);
        }
    }


    const element = document.getElementById("inputs");
    element.appendChild(inptGroup);
    inptGroup.appendChild(inpt);
    inptGroup.appendChild(button);

    // Event Listener To Create New Input
    inpt.addEventListener('input', updateValue);
    let inputCreated = false;

    function updateValue(e) {

        if (!inputCreated) {
            // make new input box
            inputCreated = true;
            data.nodes.push({
                id: button.count,
                name: e.target.value
            })
            Graph.graphData(data);
            createNewInput();
        } else {
            // update node
            let node = data.nodes.find(x => x.id === button.count);
            node.name = e.target.value;
            console.log(data);
            Graph.graphData(data);
        }
    }
}

function handleNext() {
    if (step === 1) {
        step1Next();
    } else if (step === 2) {
        // do something else here
    }
}

function step1Next() {
    // check inputs
    let badState = new Set();
    for (let i = 0; i < data.nodes.length; i++) {
        for (let j = i + 1; j < data.nodes.length; j++) {
            if (data.nodes[i].name === data.nodes[j].name) {
                badState.add(data.nodes[i].id);
                badState.add(data.nodes[j].id);
            }
        }
    }
    console.log(badState);
    const repeat = Array.from(badState);
    for (let i = 0; i < repeat.length; i++) {
        const element = document.getElementById('s-1-input-' + repeat[i]);
        console.log(element);
        element.className += " border border-danger"
    }

    // TODO: remove empty nodes from list and then check if data.nodes.length is > 0
    if (repeat.length === 0 && data.nodes.length > 0) {
        step++;
        const element = document.getElementById("inputs");
        element.style.display = "none";
    }
    // hide all of step 1

    // 
}
