/*
 * Tencent is pleased to support the open source community by making KuiklyUI
 * available.
 * Copyright (C) 2025 Tencent. All rights reserved.
 * Licensed under the License of KuiklyUI;
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://github.com/Tencent-TDS/KuiklyUI/blob/main/LICENSE
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

package com.tencent.kuikly.demo.pages.web_test.interactions

import com.tencent.kuikly.core.annotations.Page
import com.tencent.kuikly.core.base.Color
import com.tencent.kuikly.core.base.ViewBuilder
import com.tencent.kuikly.core.base.ViewRef
import com.tencent.kuikly.core.pager.Pager
import com.tencent.kuikly.core.reactive.handler.observable
import com.tencent.kuikly.core.timer.setTimeout
import com.tencent.kuikly.core.views.List
import com.tencent.kuikly.core.views.ListView
import com.tencent.kuikly.core.views.Refresh
import com.tencent.kuikly.core.views.RefreshView
import com.tencent.kuikly.core.views.RefreshViewState
import com.tencent.kuikly.core.views.Text
import com.tencent.kuikly.core.views.View
import com.tencent.kuikly.core.views.compose.Button

@Page("PullToRefreshTestPage")
internal class PullToRefreshTestPage : Pager() {

    private var refreshStatusText by observable("IDLE")
    private var refreshCount by observable(0)
    private var refreshRef: ViewRef<RefreshView>? = null

    override fun body(): ViewBuilder {
        val ctx = this
        return {
            attr {
                backgroundColor(Color.WHITE)
            }

            List {
                attr {
                    flex(1f)
                    showScrollerIndicator(true)
                }

                // Refresh must be the first child of List
                Refresh {
                    ref {
                        ctx.refreshRef = it
                    }
                    attr {
                        height(50f)
                        allCenter()
                    }
                    event {
                        refreshStateDidChange { state ->
                            when (state) {
                                RefreshViewState.IDLE -> {
                                    ctx.refreshStatusText = "IDLE"
                                }
                                RefreshViewState.PULLING -> {
                                    ctx.refreshStatusText = "PULLING"
                                }
                                RefreshViewState.REFRESHING -> {
                                    ctx.refreshStatusText = "REFRESHING"
                                    ctx.refreshCount += 1
                                    // Auto-end refresh after a simulated delay
                                    setTimeout(1500) {
                                        ctx.refreshRef?.view?.endRefresh()
                                    }
                                }
                            }
                        }
                    }
                    Text {
                        attr {
                            text(ctx.refreshStatusText)
                            fontSize(14f)
                            color(0xFF666666)
                        }
                    }
                }

                // Begin Refresh button
                Button {
                    attr {
                        titleAttr {
                            text("Begin Refresh")
                        }
                        size(width = 200f, height = 44f)
                        margin(left = 16f, top = 12f)
                        backgroundColor(0xFF1976D2)
                    }
                    event {
                        click {
                            ctx.refreshRef?.view?.beginRefresh(true)
                        }
                    }
                }

                // List items to make the list scrollable
                for (i in 0 until 25) {
                    View {
                        attr {
                            height(48f)
                            flexDirectionRow()
                            alignItemsCenter()
                            padding(left = 16f, right = 16f)
                            backgroundColor(if (i % 2 == 0) Color.WHITE else Color(0xFFF5F5F5))
                        }
                        Text {
                            attr {
                                text("Item " + (i + 1))
                                fontSize(15f)
                                color(Color.BLACK)
                            }
                        }
                    }
                }
            }
        }
    }
}
