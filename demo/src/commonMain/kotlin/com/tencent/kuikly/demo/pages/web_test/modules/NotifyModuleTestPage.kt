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
    private var receivedCount by observable(0)
    private var callbackRef: String? = null

    companion object {
        private const val TEST_EVENT = "web_test_notify_event"
        private const val LISTEN_EVENT = "web_test_listen_event"
    }

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
            // Send (postNotify) button
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
                            .postNotify(TEST_EVENT, JSONObject().apply { put("count", ctx.sendCount) })
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
            // addNotify button — registers a listener and exercises KRNotifyModule.addNotify
            View {
                attr {
                    backgroundColor(Color(0xFF388E3C))
                    padding(12f)
                    marginTop(16f)
                    accessibility("addNotify")
                }
                event {
                    click {
                        val module = ctx.acquireModule<NotifyModule>(NotifyModule.MODULE_NAME)
                        ctx.callbackRef = module.addNotify(LISTEN_EVENT) { data ->
                            ctx.receivedCount += 1
                        }
                        // Immediately post to the listened event to trigger the callback
                        module.postNotify(LISTEN_EVENT, JSONObject().apply { put("test", 1) })
                    }
                }
                Text {
                    attr {
                        text("addNotify")
                        color(Color.WHITE)
                    }
                }
            }
            // removeNotify button — exercises KRNotifyModule.removeNotify
            View {
                attr {
                    backgroundColor(Color(0xFFE53935))
                    padding(12f)
                    marginTop(8f)
                    accessibility("removeNotify")
                }
                event {
                    click {
                        val ref = ctx.callbackRef ?: return@click
                        ctx.acquireModule<NotifyModule>(NotifyModule.MODULE_NAME)
                            .removeNotify(LISTEN_EVENT, ref)
                        ctx.callbackRef = null
                    }
                }
                Text {
                    attr {
                        text("removeNotify")
                        color(Color.WHITE)
                    }
                }
            }
            Text {
                attr {
                    text("received:${ctx.receivedCount}")
                    color(0xFF2E7D32)
                    marginTop(8f)
                }
            }
        }
    }
}
