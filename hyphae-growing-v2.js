/*****************************************************
 * If you don't see anything, then just wait a while.
 *****************************************************/

function HyphaeGrowing(config, parentEl=false, isDebug=false) {
    let isRunning = false;
    let runningInterval = null;

    parentEl = parentEl === false ? document.body : (parentEl instanceof Element ? parentEl : document.querySelector(parentEl));

    let width = config.width;
    let height = config.height;
    if ((!width || !height) && parentEl instanceof Element) {
        const resizeCanvasWithWindow = () => {
            const parentStyle = window.getComputedStyle(parentEl);
            width = parseInt(parentStyle.width);
            height = parseInt(parentStyle.height);
        };
        resizeCanvasWithWindow();
        window.addEventListener('resize', resizeCanvasWithWindow);
    }

    const canvasEl = document.createElement('canvas');
    canvasEl.width = width;
    canvasEl.height = height;

    parentEl.appendChild(canvasEl);
    const canvasContext = canvasEl.getContext("2d");
    canvasContext.fillStyle = 'rgba(200,200,200,0)';
    canvasContext.strokeStyle = config.lineColor || 'black';

    // smaller of the two dimensions of canvas - a buffer
    const hyphalRadius = Math.min(width, height)/2 - 20;

    const line = (x1, y1, x0,y0) => {
        canvasContext.moveTo(x0, y0);
        canvasContext.lineTo(x1, y1);
        canvasContext.stroke();
    };

    const isWithinBounds = (x,y) => {
        return x >= 0 && x < width && y >= 0 && y < height;
    };

    const isWithinHyphalCircle = (x,y) => {
        return Math.sqrt( Math.pow((x - (width/2)), 2) + Math.pow((y - (height/2)), 2) ) <= hyphalRadius;
    };


    // defaults
    if (!config.pBranchOff) config.pBranchOff = 0.3; // Probability of a new branch forming at tip
    if (!config.pBranchRandomDeath) config.pBranchRandomDeath = 0.0; // Probability of a branch spontaneously stopping growing
    if (!config.growthLengthMin) config.growthLengthMin = 2; // length of growth in pixels
    if (!config.growthLengthMax) config.growthLengthMax = 4; // length of growth in pixels
    if (!config.growthLengthIncrement) config.growthLengthIncrement = 2; // length of growth in pixels
    if (!config.allowBranchOverlap) config.allowBranchOverlap = false;
    if (!config.timeBetweenGrowth) config.timeBetweenGrowth = 10; // Speed of growth
    if (!config.angleDeltaRange) config.angleDeltaRange = 25;
    if (!config.branchMaxCount) config.branchMaxCount = 4;
    if (!config.branchGrowthMaxAttempts) config.branchGrowthMaxAttempts = 10;
    if (!config.pixelPrecision) config.pixelPrecision = 1;

    // Point at which the hyphae grows
    const growthMatrix = {};
    const isPointOccupied = (x,y) => {
        return growthMatrix[x+'_'+y];
    };
    const nearbyRadius = 1;
    const arePointsNearbyOccupied = (x,y, x0, y0) => {
        let isOccupied = false;
        for(let xi=-1; xi<=1; xi++) {
            for(let yi=-1; yi<=1; yi++) {
                if (xi + x === x0 && yi + y === y0) {
                    continue;
                }
                if (isPointOccupied(xi + x, yi + y)) {
                    return true;
                }
            }
        }
        return false;
    };
    const Growth = (x=width/2, y=height/2, angle=null, growthCyclesWithoutBranching=0) => {
        if (angle === null) {
            // initial angle is random
            angle = Math.floor(Math.random() * 360);
        }

        let potentialBranchCount = Math.ceil(Math.random() * config.branchMaxCount);
        let attemptedBranchCount = 0;

        const grow = () => {

            let x1 = x, y1 = y, newAngle = 0;

            // attempts (i times)
            let hasGrownBranch = false;
            for(let ai = 0; ai < (config.allowBranchOverlap ? 1 : config.branchGrowthMaxAttempts); ai++) {
                // the new angle should add be [-angleDelta/2, +angleDelta/2]
                newAngle = angle + (-1 * (config.angleDeltaRange/2)) + Math.random() * config.angleDeltaRange;

                const growthLength = config.growthLengthMin + Math.ceil(Math.random() * config.growthLengthMax);
                if (config.allowBranchOverlap) {
                    x1 = Math.ceil( config.pixelPrecision * (x + growthLength * Math.cos(newAngle)) ) / config.pixelPrecision;
                    y1 = Math.ceil( config.pixelPrecision * (y + growthLength * Math.sin(newAngle)) ) / config.pixelPrecision;
                    hasGrownBranch = isWithinBounds(x1, y1);
                } else {
                    let isFirstGrowthIncrement = true;
                    for(let i = config.growthLengthIncrement; i <= growthLength; i+=config.growthLengthIncrement) {
                        x1 = Math.ceil( config.pixelPrecision * (x + i * Math.cos(newAngle)) ) / config.pixelPrecision;
                        y1 = Math.ceil( config.pixelPrecision * (y + i * Math.sin(newAngle)) ) / config.pixelPrecision;

                        if (arePointsNearbyOccupied(x1,y1, x,y) || !isWithinHyphalCircle(x1, y1) || !isWithinBounds(x1, y1)) {
                            // no growth (bumped into other branch/frame edge on 1st try)
                            if (isFirstGrowthIncrement) {
                                //console.log('hit other growth too soon');
                                break;
                            }
                            // growth possibly up to here only (bumped into another branch/frame edge after 1st try)
                            else {
                                //console.log('grew, but not all the way');
                                hasGrownBranch = true;
                                break;
                            }
                        } else {
                            hasGrownBranch = true;
                            growthMatrix[x1+'_'+y1] = true;
                        }
                        isFirstGrowthIncrement = false;
                    }
                }

                if (hasGrownBranch) {
                    break;
                }
            }
            attemptedBranchCount++;

            if (hasGrownBranch) {
                line(x1, y1, x, y);
                if (Math.random() < config.pBranchOff) {
                    // Create a new growing point from tip of branch and current angle
                    return Growth(x1, y1, newAngle);
                } else {
                    potentialBranchCount = Math.ceil(Math.random() * config.branchMaxCount);
                    attemptedBranchCount = 0;
                    growthCyclesWithoutBranching++;
                    x = x1;
                    y = y1;
                }
            }

            return false;
        };

        return {
            grow,
            isDoneGrowing: () => {
                return (attemptedBranchCount >= potentialBranchCount) || Math.random() < (growthCyclesWithoutBranching * config.pBranchRandomDeath);
            }
        }
    };

    const growingBranches = [Growth()];

    const model = {
        maturedBranchesCount: 0,
        growingBranchesCount: 0,
        matrixPixelsCount: 0,
        isRunning: false
    };

    const draw = () => {
        const newBranches = [];
        const maturedBranches = [];

        const actuallyGrowingBranches = {};
        const growingBranchesCount = growingBranches.length;
        if (growingBranchesCount > 1000) {
            // get half of the growing branches indeces, up to 1000 max
            const maxRandIndeces = Math.min(500,growingBranchesCount/2);
            for(let i=0; i<maxRandIndeces; i++) {
                const randIndex = Math.floor(Math.random() * growingBranchesCount);
                actuallyGrowingBranches[randIndex] = true;
            }
        } else {
            for(let i in growingBranches) {
                actuallyGrowingBranches[i] = true;
            }
        }
        for (let i of Object.keys(actuallyGrowingBranches)) {
            const newBranch = growingBranches[i].grow();
            if (newBranch) {
                newBranches.push(newBranch);
            }

            if (growingBranches[i].isDoneGrowing()) {
                maturedBranches.push(i);
            }
        }

        maturedBranches.reverse();
        for (let i of maturedBranches) {
            growingBranches.splice(i,1);
        }
        for (let branch of newBranches) {
            growingBranches.push(branch);
        }

        if (growingBranches.length === 0) {
            isRunning = false;
            callbackEventListeners('done-growing');
        }

        model.maturedBranchesCount += maturedBranches.length;
        model.growingBranchesCount = growingBranches.length;
        model.matrixPixelsCount = Object.keys(growthMatrix).length;
        model.isRunning = isRunning;
        callbackEventListeners('branch-grown');

        if (!isRunning) {
            if (runningInterval) {
                clearInterval(runningInterval);
            }
            return;
        }
    };

    let eventListeners = {};
    const addEventListener = (type, cb) => {
        if (!eventListeners[type]) {
            eventListeners[type] = [];
        }
        eventListeners[type].push(cb);
    };
    const callbackEventListeners = (type) => {
        if (!eventListeners[type]) {
            return;
        }
        eventListeners[type].forEach((cb) => {
            cb();
        });
    };

    const destroy = () => {
        if (!HyphaeGrowing.INSTANCE) {
            return;
        }

        if (runningInterval) {
            clearInterval(runningInterval);
        }
        isRunning = false;
        if (canvasEl) {
            parentEl.removeChild(canvasEl);
        }

        eventListeners = {};

        HyphaeGrowing.INSTANCE = null;
    };

    const startPause = () => {
        if (!HyphaeGrowing.INSTANCE) {
            return;
        }

        if (!isRunning) {
            start();
        } else {
            pause();
        }
    };
    const start = () => {
        if (!HyphaeGrowing.INSTANCE) {
            return;
        }

        if (!isRunning) {
            runningInterval = setInterval(draw, config.timeBetweenGrowth);
        }
        isRunning = true;
    };

    const pause = () => {
        if (!HyphaeGrowing.INSTANCE) {
            return;
        }

        if (isRunning) {
            clearInterval(runningInterval);
        }
        isRunning = false;
    };


    const getModel = () => {
        const clientModel = {};
        Object.entries(model).forEach((entry) => {
            clientModel[entry[0]] = entry[1];
        });
        return Object.freeze(clientModel);
    };

    if (isDebug) {
        canvasEl.addEventListener('click', () => {
            // mouse click/tap
            start();
        });
    }

    HyphaeGrowing.INSTANCE = {
        start,
        pause,
        startPause,
        destroy,
        on: addEventListener,
        getModel
    };
    return HyphaeGrowing.INSTANCE;
}

/*
Sample config
*/
HyphaeGrowing.favoriteConfigs = [
    {
        lineColor: 'rgb(176, 137, 37)',
        pBranchOff : 0.3,
        pBranchRandomDeath : 0.0,
        growthLengthMin : 2,
        growthLengthMax : 4,
        growthLengthIncrement : 2,
        allowBranchOverlap : false,
        timeBetweenGrowth : 10,
        angleDeltaRange : 25,
        branchMaxCount : 4,
        branchGrowthMaxAttempts : 10,
        pixelPrecision : 1
    },
    {
        lineColor: 'rgb(176, 137, 37)',
        pBranchOff : 0.4,
        pBranchRandomDeath : 0.05,
        growthLengthMin : 2,
        growthLengthMax : 4,
        growthLengthIncrement : 2,
        allowBranchOverlap : false,
        timeBetweenGrowth : 10,
        angleDeltaRange : 25,
        branchMaxCount : 4,
        branchGrowthMaxAttempts : 10,
        pixelPrecision : 1
    },
    {
        lineColor: 'rgb(176, 137, 37)',
        pBranchOff : 0.3,
        pBranchRandomDeath : 0.0,
        growthLengthMin : 2,
        growthLengthMax : 4,
        growthLengthIncrement : 2,
        allowBranchOverlap : false,
        timeBetweenGrowth : 10,
        angleDeltaRange : 45,
        branchMaxCount : 4,
        branchGrowthMaxAttempts : 10,
        pixelPrecision : 1
    }
];
/* */