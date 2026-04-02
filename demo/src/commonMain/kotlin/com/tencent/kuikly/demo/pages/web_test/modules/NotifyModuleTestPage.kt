package com.tencent.kuikly.demo.pages.web_test.modules

import com.tencent.kuikly.core.annotations.Page
import com.tencent.kuikly.core.base.Color
import com.tencent.kuikly.core.base.ViewBuilder
import com.tencent.kuikly.core.module.NotifyModule
import com.tencent.kuikly.core.nvi.serialization.json.JSONObject
import com.tencent.kuikly.core.pager.Pager
import com.tencent.kuikly.core.reactive.handler.observable
import com.tencent.kuikly.core.views.Text
import com.tencent.kuikly.core.views.View

@Page("NotifyModuleTestPage")
internal class NotifyModuleTestPage : Pager() {
    private var sendCount by observable(0)

    override fun body(): ViewBuilder {
        val ctx = this
        return {
            attr {
                backgroundColor(Color.WHITE)
                padding(20f)
            }
            Text {
                attr {
                    text("NotifyModuleTestPage")
                    fontSize(20f)
                    color(Color.BLACK)
                }
            }
            View {
                attr {
                    backgroundColor(0xFF1E88E5)
                    padding(12f)
                    marginTop(16f)
                    accessibility("send")
                }
                event {
                    click {
                        ctx.sendCount += 1
                        ctx.acquireModule<NotifyModule>(NotifyModule.MODULE_NAME)
                            .postNotify("web_test_notify_event", JSONObject().apply { put("count", ctx.sendCount) })
                    }
                }
                Text {
                    attr {
                        text("send")
                        color(Color.WHITE)
                    }
                }
            }
            Text {
                attr {
                    text("count:${ctx.sendCount}")
                    color(0xFF1565C0)
                    marginTop(16f)
                }
            }
        }
    }
}
