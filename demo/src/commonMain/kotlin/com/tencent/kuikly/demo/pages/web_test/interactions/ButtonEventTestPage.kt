package com.tencent.kuikly.demo.pages.web_test.interactions

import com.tencent.kuikly.core.annotations.Page
import com.tencent.kuikly.core.base.Color
import com.tencent.kuikly.core.base.ViewBuilder
import com.tencent.kuikly.core.pager.Pager
import com.tencent.kuikly.core.reactive.handler.observable
import com.tencent.kuikly.core.views.List
import com.tencent.kuikly.core.views.Text
import com.tencent.kuikly.core.views.compose.Button

@Page("ButtonEventTestPage")
internal class ButtonEventTestPage : Pager() {
    private var clickCount by observable(0)
    private var doubleClickCount by observable(0)
    private var longPressCount by observable(0)

    override fun body(): ViewBuilder {
        val ctx = this
        return {
            List {
                attr {
                    flex(1f)
                    backgroundColor(Color.WHITE)
                }
                Text {
                    attr {
                        text("ButtonEventTestPage")
                        color(Color.BLACK)
                        marginTop(20f)
                        marginLeft(16f)
                    }
                }
                Button {
                    attr {
                        titleAttr {
                            text(if (ctx.clickCount == 0) "click-button" else if (ctx.clickCount == 1) "click-once" else "click-twice")
                        }
                        size(width = 180f, height = 52f)
                        margin(left = 16f, top = 16f)
                        backgroundColor(0xFF4CAF50)
                    }
                    event { click { ctx.clickCount = minOf(ctx.clickCount + 1, 2) } }
                }
                Button {
                    attr {
                        titleAttr {
                            text(if (ctx.doubleClickCount == 0) "double-button" else if (ctx.doubleClickCount == 1) "double-once" else "double-twice")
                        }
                        size(width = 180f, height = 52f)
                        margin(left = 16f, top = 16f)
                        backgroundColor(0xFF1E88E5)
                    }
                    event { doubleClick { ctx.doubleClickCount = minOf(ctx.doubleClickCount + 1, 2) } }
                }
                Button {
                    attr {
                        titleAttr {
                            text(if (ctx.longPressCount == 0) "long-button" else if (ctx.longPressCount == 1) "long-once" else "long-twice")
                        }
                        size(width = 180f, height = 52f)
                        margin(left = 16f, top = 16f)
                        backgroundColor(0xFF8E24AA)
                    }
                    event { longPress { ctx.longPressCount = minOf(ctx.longPressCount + 1, 2) } }
                }
            }
        }
    }
}
