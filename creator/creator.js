function HyphaeGrowingCreator() {
    if (HyphaeGrowingCreator.INSTANCE) {
        return HyphaeGrowingCreator.INSTANCE;
    }

    const VueTemplates = {};
    const getVueTemplate = (name, isSlotted) => {
        if (!VueTemplates['__initialized']) {
            Array.from(document.querySelectorAll('[data-template]')).forEach((item) => { VueTemplates[item.dataset.template] = item; item.parentElement.removeChild(item); });
            VueTemplates['__initialized'] = true;
        }
        if (!!VueTemplates[name]) {
            return VueTemplates[name];
        }

        return '<div><slot></slot></div>';
    };


    const vueComponents = {};
    vueComponents['layer-control'] = {
        props: ['model'],
        data: function () {
            return {
            }
        },
        //template: '<div v-bind:class="classes()" v-on:click.prevent.stop="onClick"><slot></slot></div>',
        template: getVueTemplate('layer-control'),
        methods: {
            classes: function() {

            },
            onClick : function() {
                this.model.toggle();
                this.$forceUpdate();
            }
        }
    };

    const vueDirectives = {};
    vueDirectives['dblclick-select'] = {
        bind: function (el, binding) {
            el.style.userSelect = 'none';
        },
        update: function (el, binding) {
        },
        unbind: function () {
        }
    };

    const vueAppConfig  = {
        el: '#app',
        data: {
            model: false,
            isRunning: false,
            isMature: false,
            isFullDetailView: false,
            isBriefDetailView: false,
            config: {},
            hyphaeContainerEl: '',
            controls: {
                speed: {
                    value: 6,
                    percent: 60,
                    valueMap: { "1": 1000, "2": 500,  "3": 250, "4":200, "5": 150, "6": 100, "7": 50, "8":25, "9": 10 }
                },
                complexity: {
                    value: 6,
                    percent: 60,
                    valueMap: { "1": "25,2,2,4", "2": "30,2,2,6",  "3": "35,3,3,7", "4":"40,3,4,8", "5": "45,5,5,9", "6": "50,7,6,10", "7": "55,10,7,11", "8": "60,10,8,12", "9": "70,20,9,13"}
                }
            }
        },
        mounted: function() {
            if (!this.hyphaeContainerEl) {
                throw new Error('hyphage growth creator: no container element');
            }
            this.$nextTick(function () {
                //RE-INIT WF as Vue.js init breaks WF interactions
                //Webflow.destroy();
                //Webflow.ready();
                //Webflow.require('ix2').init();
            });
        },
        methods: {
            startPause: function(newState) {
                if (typeof newState === "boolean") {
                    this.isRunning = newState;
                } else {
                    this.isRunning = !this.isRunning;
                }

                if (this.isRunning) {
                    this.start();
                } else {
                    this.pause();
                }
            },
            start: function() {
                if (this.isMature) {
                    this.stop();
                }

                if (!HyphaeGrowing.INSTANCE) {
                    // grab a random favorite config
                    this.config = HyphaeGrowing.getRandomFavoriteConfig();

                    HyphaeGrowing(this.config, this.hyphaeContainerEl, true);
                    HyphaeGrowing.INSTANCE.on('branch-grown', this.updateModel);
                    HyphaeGrowing.INSTANCE.on('done-growing', this.onDoneGrowing);

                    this.updateConfigFromControls();
                }
                HyphaeGrowing.INSTANCE.start();
                this.isRunning = true;
            },
            pause: function() {
                if (!!HyphaeGrowing.INSTANCE) {
                    HyphaeGrowing.INSTANCE.pause();
                }
                this.isRunning = false;
            },
            stop: function() {
                if (!!HyphaeGrowing.INSTANCE) {
                    HyphaeGrowing.INSTANCE.stop();
                }
                this.isRunning = false;
                this.isMature = false;
            },
            updateModel: function() {
                this.model = HyphaeGrowing.INSTANCE.getModel();
            },
            onDoneGrowing: function() {
                this.isMature = true;
                this.isRunning = false;
                this.updateModel();
            },
            toggleFullDetail: function(e) {
                this.isFullDetailView = !this.isFullDetailView;
                const el = e.target;
                if (!!el.dataset.onText && el.dataset.offText) {
                    el.innerHTML = this.isFullDetailView ? el.dataset.onText : el.dataset.offText;
                }
            },
            toggleBriefDetail: function() {
                const self = this;
                this.isBriefDetailView = !this.isBriefDetailView;
                if (!this.isBriefDetailView) {
                    this.isFullDetailView = false;
                }
            },
            updateConfigFromControls: function() {
                this.config.timeBetweenGrowth = this.controls.speed.valueMap[String(this.controls.speed.value)];

                const complexity = this.controls.complexity.valueMap[String(this.controls.complexity.value)];
                const [angle, maxBranches, growthLengthMin, growthLengthMax] = complexity.split(',');
                this.config.angleDeltaRange = parseInt(angle);
                this.config.branchMaxCount = parseInt(maxBranches);
                this.config.growthLengthMax = parseInt(growthLengthMin);
                this.config.growthLengthMin = parseInt(growthLengthMax);
            },
            changeControlValue: function(name, delta) {
                const wasRunning = this.isRunning;
                if (this.isRunning) {
                    this.pause();
                }

                let newValue = this.controls[name].value + delta;
                if (newValue < 1) {
                    newValue = 1;
                } else if (newValue > 9) {
                    newValue = 9;
                }
                this.controls[name].value = newValue;
                this.controls[name].percent = newValue * 10;
                this.updateConfigFromControls();

                if (wasRunning) {
                    this.start();
                }
            },
            noop: () => {}
        }
    };

    let isInit = false;
    const init = (hyphaeContainerEl) => {
        if (isInit) {
            return;
        }

        Object.entries(vueComponents).forEach((entry) => {
            const [name, config] = entry;
            Vue.component(name, config);
        });
        Object.entries(vueDirectives).forEach((entry) => {
            const [name, config] = entry;
            Vue.directive(name, config);
        });
        vueAppConfig.data.hyphaeContainerEl = hyphaeContainerEl;
        HyphaeGrowingCreator.INSTANCE.vue = new Vue(vueAppConfig);
        isInit = true;
    };

    HyphaeGrowingCreator.INSTANCE = {
        init,
        vue: null
    };

    return HyphaeGrowingCreator.INSTANCE;
}