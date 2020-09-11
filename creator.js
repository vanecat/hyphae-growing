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
    vueComponents['sample-component'] = {
        props: ['model'],
        data: function () {
            return {
            }
        },
        //template: '<div v-bind:class="classes()" v-on:click.prevent.stop="onClick"><slot></slot></div>',
        template: getVueTemplate('sample-component'),
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
        el: '',
        data: {
            model: false,
            isRunning: false,
            isMature: false,
            isFullDetailView: false,
            isBriefDetailView: false,
            config: {},
            hyphaeContainerSelector: '',
            controls: {
                speed: {
                    value: 6,
                    percent: 60,
                    valueMap: { "1": 1000, "2": 500,  "3": 250, "4":200, "5": 150, "6": 100, "7": 50, "8":25, "9": 10 }
                },
                complexity: {
                    value: 3,
                    percent: 30,
                    valueMap: { "1": "45,8,1,2,2,4", "2": "35,7,2,2,2,4",  "3": "35,7,2,2,2,6", "4":"35,5,3,3,3,6", "5": "35,5,3,3,3,9", "6": "35,5,4,4,4,12", "7": "35,5,4,4,4,16", "8": "35,5,5,5,5,15", "9": "35,5,6,6,6,18"}
                }
            }
        },
        mounted: function() {
            if (!this.hyphaeContainerSelector) {
                throw new Error('hyphage growth creator: no container element');
            }
            const self = this;
            this.$el.classList.toggle(HyphaeGrowingCreator.HIDDEN_CLASS, false);

            this.$nextTick(function () {
                //RE-INIT WF as Vue.js init breaks WF interactions
                //Webflow.destroy();
                //Webflow.ready();
                //Webflow.require('ix2').init();

                setTimeout(function () {
                    self.start();
                    self.$el.classList.toggle(HyphaeGrowingCreator.LOADED_CLASS, true);
                },500);
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
                    // base config
                    const config = Object.assign({}, HyphaeGrowing.favoriteConfigs[0]);

                    // config overrides
                    Object.assign(config, this.config);

                    HyphaeGrowing(this.config, this.hyphaeContainerSelector, true);
                    HyphaeGrowing.INSTANCE.on('growing', this.updateModel);
                    HyphaeGrowing.INSTANCE.on('done-growing', this.onDoneGrowing);
                    HyphaeGrowing.INSTANCE.on('started-growing', this.updateModel);

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
                this.isRunning = this.model.isRunning;
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
                const [angle, maxBranches, nearbyRadius, growthLengthIncrement, growthLengthMin, growthLengthMax] = complexity.split(',');
                this.config.angleDeltaRange = parseInt(angle);
                this.config.branchMaxCount = parseInt(maxBranches);
                this.config.nearbyRadius = parseInt(nearbyRadius);
                this.config.growthLengthIncrement = parseInt(growthLengthIncrement);
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
    const init = (appElSelector, hyphaeContainerSelector, customConfigOverrides={}) => {
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
        vueAppConfig.el = appElSelector;
        vueAppConfig.data.hyphaeContainerSelector = hyphaeContainerSelector;

        Vue.config.errorHandler = function (err, vm, info) {
            // handle error
            // `info` is a Vue-specific error info, e.g. which lifecycle hook
            // the error was found in. Only available in 2.2.0+
            throw Error(err);
        };

        vueAppConfig.data.config = Object.assign(customConfigOverrides, vueAppConfig.data.config);
        HyphaeGrowingCreator.INSTANCE.vue = new Vue(vueAppConfig);
        isInit = true;
    };

    HyphaeGrowingCreator.INSTANCE = {
        init,
        vue: null
    };

    return HyphaeGrowingCreator.INSTANCE;
}
HyphaeGrowingCreator.LOADED_CLASS = 'loaded';
HyphaeGrowingCreator.HIDDEN_CLASS = 'hidden';
HyphaeGrowingCreator.addPreInitStyles = (appElSelector) => {
    if (window.HyphaePreInitStyles) {
        const stylesheet = HyphaePreInitStyles();
        stylesheet.add(appElSelector, 'opacity: 0; transition: opacity ease-out 2500ms;');
        stylesheet.add(`${appElSelector}.${HyphaeGrowingCreator.LOADED_CLASS}`, 'opacity: 1;');
    }
};
