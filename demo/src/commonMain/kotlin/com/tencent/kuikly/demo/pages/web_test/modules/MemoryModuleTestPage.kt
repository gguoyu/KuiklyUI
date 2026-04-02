package com.tencent.kuikly.demo.pages.web_test.modules

import com.tencent.kuikly.core.annotations.Page
import com.tencent.kuikly.core.base.Color
import com.tencent.kuikly.core.base.ViewBuilder
import com.tencent.kuikly.core.pager.Pager
import com.tencent.kuikly.core.reactive.handler.observable
import com.tencent.kuikly.core.views.List
import com.tencent.kuikly.core.views.Text
import com.tencent.kuikly.core.views.compose.Button
import com.tencent.kuikly.demo.pages.demo.dumpMemory

@Page("MemoryModuleTestPage")
internal class MemoryModuleTestPage : Pager() {
    private val retainedItems = mutableListOf<String>()
    private var retainedCount by observable(0)

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
                        text("MemoryModuleTestPage")
                        color(Color.BLACK)
                    }
                }
                Button {
                    attr {
                        titleAttr { text("Create And Retain 1000 Items") }
                        size(width = 280f, height = 56f)
                        margin(left = 16f, top = 16f)
                        backgroundColor(0xFFF9A825)
                    }
                    event {
                        click {
                            val start = ctx.retainedItems.size
                            repeat(1000) { index -> ctx.retainedItems.add("item-${start + index}") }
                            ctx.retainedCount = ctx.retainedItems.size
                        }
                    }
                }
                Button {
                    attr {
                        titleAttr { text("Dump Memory") }
                        size(width = 280f, height = 56f)
                        margin(left = 16f, top = 16f)
                        backgroundColor(0xFF5E35B1)
                    }
                    event { click { dumpMemory() } }
                }
                Text {
                    attr {
                        text("retained:${ctx.retainedCount}")
                        color(0xFF37474F)
                        margin(left = 16f, top = 12f)
                    }
                }
            }
        }
    }
}
