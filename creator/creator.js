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
    vueDirectives['zzsample'] = {
        bind: function (el, binding) {
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
                    this.config = HyphaeGrowing.favoriteConfigs[Math.floor(Math.random() * HyphaeGrowing.favoriteConfigs.length)];

                    HyphaeGrowing(this.config, this.hyphaeContainerEl, true);
                    HyphaeGrowing.INSTANCE.on('branch-grown', this.updateModel);
                    HyphaeGrowing.INSTANCE.on('done-growing', this.onDoneGrowing);
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
                    HyphaeGrowing.INSTANCE.destroy();
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
            },

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