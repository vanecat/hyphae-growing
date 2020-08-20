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

    const vueAppConfig  = {
        el: '#app',
        data: {
            activeBranches: 100,
            deadBranches: 1000,
            isRunning: false,
            isAlive: false,
            isDetailView: false,
            config: {},
            hyphaeContainerEl: ''
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
            playPause: function(newState) {
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
                if (!HyphaeGrowing.INSTANCE) {
                    // grab a random favorite config
                    this.config = HyphaeGrowing.favoriteConfigs[Math.floor(Math.random() * HyphaeGrowing.favoriteConfigs.length)];

                    HyphaeGrowing(this.config, this.hyphaeContainerEl, true);
                    this.isAlive = true;
                }
                HyphaeGrowing.INSTANCE.start();
            },
            pause: function() {
                if (!!HyphaeGrowing.INSTANCE) {
                    HyphaeGrowing.INSTANCE.pause();
                }
            },
            stop: function() {
                if (!!HyphaeGrowing.INSTANCE) {
                    HyphaeGrowing.INSTANCE.destroy();
                }
                this.isRunning = false;
                this.isAlive = false;
            }
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
        vueAppConfig.data.hyphaeContainerEl = hyphaeContainerEl;
        HyphaeGrowingCreator.vueInstance = new Vue(vueAppConfig);
        isInit = true;
    };

    HyphaeGrowingCreator.INSTANCE = {
        init
    };

    return HyphaeGrowingCreator.INSTANCE;
}