package com.tencent.kuikly.demo.pages.web_test.modules

import com.tencent.kuikly.core.annotations.Page
import com.tencent.kuikly.core.base.Color
import com.tencent.kuikly.core.base.ViewBuilder
import com.tencent.kuikly.core.module.ModuleConst
import com.tencent.kuikly.core.module.RouterModule
import com.tencent.kuikly.core.pager.Pager
import com.tencent.kuikly.core.reactive.handler.observable
import com.tencent.kuikly.core.views.List
import com.tencent.kuikly.core.views.Text
import com.tencent.kuikly.core.views.View
import com.tencent.kuikly.core.views.compose.Button

/**
 * RouterModule test page
 *
 * Targets uncovered KRRouterModule (h5 layer):
 * 1. openPage — opens a new page via RouterModule
 * 2. closePage — closes current page via RouterModule
 */
@Page("RouterModuleTestPage")
internal class RouterModuleTestPage : Pager() {
    private var actionLog by observable("idle")

    override fun body(): ViewBuilder {
        val ctx = this
        return {
            attr {
                backgroundColor(Color.WHITE)
            }

            List {
                attr {
                    flex(1f)
                }

                Text {
                    attr {
                        text("RouterModuleTestPage")
                        fontSize(20f)
                        color(Color.BLACK)
                        marginLeft(16f)
                        marginTop(16f)
                    }
                }

                Text {
                    attr {
                        text("Tests KRRouterModule (h5 layer)")
                        fontSize(12f)
                        color(0xFF999999)
                        marginLeft(16f)
                        marginTop(4f)
                    }
                }

                // === Open Page ===
                Button {
                    attr {
                        titleAttr { text("Open Page (ClickTestPage)") }
                        size(width = 280f, height = 56f)
                        margin(left = 16f, top = 16f)
                        backgroundColor(0xFF1976D2)
                    }
                    event {
                        click {
                            ctx.acquireModule<RouterModule>(ModuleConst.ROUTER).openPage("ClickTestPage")
                            ctx.actionLog = "openPage called"
                        }
                    }
                }

                // === Close Page ===
                Button {
                    attr {
                        titleAttr { text("Close Page") }
                        size(width = 280f, height = 56f)
                        margin(left = 16f, top = 12f)
                        backgroundColor(0xFFE53935)
                    }
                    event {
                        click {
                            ctx.acquireModule<RouterModule>(ModuleConst.ROUTER).closePage()
                            ctx.actionLog = "closePage called"
                        }
                    }
                }

                // Status
                Text {
                    attr {
                        text("log: ${ctx.actionLog}")
                        fontSize(14f)
                        color(0xFF666666)
                        marginLeft(16f)
                        marginTop(12f)
                    }
                }

                View { attr { height(50f) } }
            }
        }
    }
}
