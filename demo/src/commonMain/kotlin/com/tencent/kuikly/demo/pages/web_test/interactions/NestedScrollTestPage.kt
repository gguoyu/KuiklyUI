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
import com.tencent.kuikly.core.views.KRNestedScrollMode
import com.tencent.kuikly.core.views.List
import com.tencent.kuikly.core.views.ListView
import com.tencent.kuikly.core.views.Text
import com.tencent.kuikly.core.views.View

/**
 * Nested scroll interaction test page.
 *
 * Coverage targets:
 * 1. H5NestScrollHelper — setNestedScroll, touch/mouse/wheel nested scroll
 * 2. H5ListPagingHelper — nested PageList paths
 * 3. bouncesEnable variation
 * 4. setContentOffset with animated = true
 */
@Page("NestedScrollTestPage")
internal class NestedScrollTestPage : Pager() {

    private var scrollAnimCount by observable(0)
    private var innerListRef: ViewRef<ListView<*, *>>? = null

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

                // Title
                View {
                    attr {
                        height(50f)
                        backgroundColor(0xFF1565C0)
                        allCenter()
                    }
                    Text {
                        attr {
                            text("Nested Scroll Test Page")
                            fontSize(18f)
                            fontWeightBold()
                            color(Color.WHITE)
                        }
                    }
                }

                // Section 1: PARENT_FIRST / SELF_ONLY nested scroll
                View {
                    attr {
                        height(36f)
                        padding(left = 16f)
                        justifyContentCenter()
                        backgroundColor(0xFFE3F2FD)
                    }
                    Text {
                        attr {
                            text("Section 1: PARENT_FIRST / SELF_ONLY")
                            fontSize(13f)
                            fontWeightBold()
                            color(0xFF1565C0)
                        }
                    }
                }

                List {
                    ref {
                        ctx.innerListRef = it
                    }
                    attr {
                        height(200f)
                        backgroundColor(0xFFFFEBEE)
                        bouncesEnable(true)
                        nestedScroll(KRNestedScrollMode.PARENT_FIRST, KRNestedScrollMode.SELF_ONLY)
                    }
                    for (i in 1..30) {
                        View {
                            attr {
                                height(44f)
                                margin(left = 12f, top = 4f, right = 12f)
                                backgroundColor(if (i % 2 == 0) 0xFFE57373 else 0xFFEF9A9A)
                                borderRadius(6f)
                                allCenter()
                            }
                            Text {
                                attr {
                                    text("Inner Item $i")
                                    fontSize(14f)
                                    color(Color.WHITE)
                                    fontWeightBold()
                                }
                            }
                        }
                    }
                }

                // Button to test animated setContentOffset
                View {
                    attr {
                        height(40f)
                        margin(left = 16f, top = 8f, right = 16f)
                        backgroundColor(0xFF1976D2)
                        borderRadius(8f)
                        allCenter()
                    }
                    event {
                        click {
                            ctx.scrollAnimCount += 1
                            ctx.innerListRef?.view?.setContentOffset(0f, 100f, animated = true)
                        }
                    }
                    Text {
                        attr {
                            text(
                                if (ctx.scrollAnimCount == 0) "Scroll Inner (animated)"
                                else "Scroll Inner: ${ctx.scrollAnimCount}"
                            )
                            fontSize(14f)
                            color(Color.WHITE)
                            fontWeightBold()
                        }
                    }
                }

                // Section 2: SELF_FIRST / SELF_FIRST nested scroll with bouncesEnable(false)
                View {
                    attr {
                        height(36f)
                        padding(left = 16f)
                        justifyContentCenter()
                        backgroundColor(0xFFE8F5E9)
                        marginTop(12f)
                    }
                    Text {
                        attr {
                            text("Section 2: SELF_FIRST / SELF_FIRST (no bounce)")
                            fontSize(13f)
                            fontWeightBold()
                            color(0xFF2E7D32)
                        }
                    }
                }

                List {
                    attr {
                        height(200f)
                        backgroundColor(0xFFE8F5E9)
                        bouncesEnable(false)
                        nestedScroll(KRNestedScrollMode.SELF_FIRST, KRNestedScrollMode.SELF_FIRST)
                    }
                    for (i in 1..30) {
                        View {
                            attr {
                                height(44f)
                                margin(left = 12f, top = 4f, right = 12f)
                                backgroundColor(if (i % 2 == 0) 0xFF66BB6A else 0xFFA5D6A7)
                                borderRadius(6f)
                                allCenter()
                            }
                            Text {
                                attr {
                                    text("Inner Item $i")
                                    fontSize(14f)
                                    color(Color.WHITE)
                                    fontWeightBold()
                                }
                            }
                        }
                    }
                }

                // Section 3: SELF_ONLY nested scroll
                View {
                    attr {
                        height(36f)
                        padding(left = 16f)
                        justifyContentCenter()
                        backgroundColor(0xFFF3E5F5)
                        marginTop(12f)
                    }
                    Text {
                        attr {
                            text("Section 3: SELF_ONLY / SELF_ONLY")
                            fontSize(13f)
                            fontWeightBold()
                            color(0xFF7B1FA2)
                        }
                    }
                }

                List {
                    attr {
                        height(200f)
                        backgroundColor(0xFFF3E5F5)
                        nestedScroll(KRNestedScrollMode.SELF_ONLY, KRNestedScrollMode.SELF_ONLY)
                    }
                    for (i in 1..30) {
                        View {
                            attr {
                                height(44f)
                                margin(left = 12f, top = 4f, right = 12f)
                                backgroundColor(if (i % 2 == 0) 0xFFAB47BC else 0xFFCE93D8)
                                borderRadius(6f)
                                allCenter()
                            }
                            Text {
                                attr {
                                    text("Inner Item $i")
                                    fontSize(14f)
                                    color(Color.WHITE)
                                    fontWeightBold()
                                }
                            }
                        }
                    }
                }

                // Filler items to make outer list scrollable
                for (i in 1..20) {
                    View {
                        attr {
                            height(48f)
                            margin(left = 16f, top = 4f, right = 16f)
                            backgroundColor(if (i % 2 == 0) Color(0xFFF5F5F5) else Color.WHITE)
                            allCenter()
                        }
                        Text {
                            attr {
                                text("Content Item $i")
                                fontSize(14f)
                                color(0xFF666666)
                            }
                        }
                    }
                }
            }
        }
    }
}
