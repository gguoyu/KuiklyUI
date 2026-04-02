package com.tencent.kuikly.demo.pages.web_test.components

import com.tencent.kuikly.core.annotations.Page
import com.tencent.kuikly.core.base.Color
import com.tencent.kuikly.core.base.ViewBuilder
import com.tencent.kuikly.core.pager.Pager
import com.tencent.kuikly.core.views.List
import com.tencent.kuikly.core.views.Text
import com.tencent.kuikly.core.views.View

@Page("SmokeTestPage")
internal class SmokeTestPage : Pager() {
    override fun body(): ViewBuilder = {
        List {
            attr {
                flex(1f)
                backgroundColor(Color.WHITE)
            }
            Text {
                attr {
                    text("Smoke")
                    fontSize(24f)
                    color(Color.BLACK)
                    marginTop(20f)
                    marginLeft(16f)
                }
            }
            View {
                attr {
                    margin(all = 16f)
                    padding(all = 16f)
                    backgroundColor(0xFFE3F2FD)
                    borderRadius(12f)
                }
                Text {
                    attr {
                        text("Selector")
                        color(0xFF0D47A1)
                    }
                }
            }
        }
    }
}
