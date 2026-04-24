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

package com.tencent.kuikly.demo.pages.web_test.composite

import com.tencent.kuikly.core.annotations.Page
import com.tencent.kuikly.core.base.Border
import com.tencent.kuikly.core.base.BorderStyle
import com.tencent.kuikly.core.base.Color
import com.tencent.kuikly.core.base.ViewBuilder
import com.tencent.kuikly.core.pager.Pager
import com.tencent.kuikly.core.reactive.handler.observable
import com.tencent.kuikly.core.views.Input
import com.tencent.kuikly.core.views.List
import com.tencent.kuikly.core.views.Text
import com.tencent.kuikly.core.views.View

/**
 * Composite scenario: Search
 *
 * Validates multi-component cooperation: Input + click trigger + list rendering
 *
 * Tests covered:
 * 1. Search input — Input text entry
 * 2. Search button click — filters a fixed data set
 * 3. Result list rendering — updates list after keyword filter
 * 4. List item click — highlight selection and show selected item
 * 5. Clear search — restore full list
 */
@Page("SearchTestPage")
internal class SearchTestPage : Pager() {

    companion object {
        private val ALL_ITEMS = listOf(
            "Apple", "Banana", "Cherry", "Date", "Elderberry",
            "Fig", "Grape", "Honeydew", "Kiwi", "Lemon",
            "Mango", "Nectarine", "Orange", "Papaya", "Quince",
            "Raspberry", "Strawberry", "Tangerine", "Ugli", "Watermelon"
        )
    }

    private var searchText by observable("")
    private var displayItems by observable(ALL_ITEMS)
    private var selectedItem by observable("")
    private var hasSearched by observable(false)

    override fun body(): ViewBuilder {
        val ctx = this
        return {
            attr {
                backgroundColor(Color.WHITE)
            }

            // Search bar (pinned above list)
            View {
                attr {
                    flexDirectionRow()
                    alignItemsCenter()
                    padding(left = 16f, right = 16f, top = 12f, bottom = 12f)
                    backgroundColor(Color.WHITE)
                }

                View {
                    attr {
                        flex(1f)
                        height(40f)
                        border(Border(1f, BorderStyle.SOLID, Color(0xFFDDDDDD)))
                        borderRadius(20f)
                        flexDirectionRow()
                        alignItemsCenter()
                        padding(left = 12f, right = 12f)
                        backgroundColor(0xFFF5F5F5)
                    }
                    Input {
                        attr {
                            flex(1f)
                            height(38f)
                            fontSize(15f)
                            color(Color.BLACK)
                            placeholder("search...")
                            placeholderColor(Color(0xFF999999))
                        }
                        event {
                            textDidChange { params ->
                                ctx.searchText = params.text
                                if (params.text.isEmpty()) {
                                    ctx.displayItems = ALL_ITEMS
                                    ctx.hasSearched = false
                                }
                            }
                        }
                    }
                }

                View {
                    attr {
                        marginLeft(8f)
                        size(60f, 40f)
                        backgroundColor(Color(0xFF2196F3))
                        borderRadius(20f)
                        allCenter()
                    }
                    event {
                        click {
                            val keyword = ctx.searchText.trim().lowercase()
                            ctx.displayItems = if (keyword.isEmpty()) {
                                ALL_ITEMS
                            } else {
                                ALL_ITEMS.filter { it.lowercase().contains(keyword) }
                            }
                            ctx.hasSearched = true
                            ctx.selectedItem = ""
                        }
                    }
                    Text {
                        attr {
                            text("search")
                            fontSize(14f)
                            color(Color.WHITE)
                            fontWeightBold()
                        }
                    }
                }
            }

            // Stats row
            View {
                attr {
                    flexDirectionRow()
                    alignItemsCenter()
                    justifyContentSpaceBetween()
                    padding(left = 16f, right = 16f, bottom = 8f)
                }
                Text {
                    attr {
                        text(
                            if (ctx.hasSearched)
                                "found: ${ctx.displayItems.size}"
                            else
                                "total: ${ctx.displayItems.size}"
                        )
                        fontSize(13f)
                        color(0xFF666666)
                    }
                }
                if (ctx.hasSearched) {
                    View {
                        attr {
                            padding(left = 8f, right = 8f, top = 4f, bottom = 4f)
                            backgroundColor(0xFFEEEEEE)
                            borderRadius(4f)
                        }
                        event {
                            click {
                                ctx.searchText = ""
                                ctx.displayItems = ALL_ITEMS
                                ctx.hasSearched = false
                                ctx.selectedItem = ""
                            }
                        }
                        Text {
                            attr {
                                text("clear")
                                fontSize(13f)
                                color(0xFF666666)
                            }
                        }
                    }
                }
            }

            // Selected item banner
            if (ctx.selectedItem.isNotEmpty()) {
                View {
                    attr {
                        margin(left = 16f, right = 16f, bottom = 8f)
                        padding(all = 12f)
                        backgroundColor(0xFFE3F2FD)
                        borderRadius(8f)
                    }
                    Text {
                        attr {
                            text("selected: ${ctx.selectedItem}")
                            fontSize(14f)
                            color(Color(0xFF1565C0))
                            fontWeightBold()
                        }
                    }
                }
            }

            // Result list
            List {
                attr {
                    flex(1f)
                }

                ctx.displayItems.forEachIndexed { index, item ->
                    View {
                        attr {
                            flexDirectionRow()
                            alignItemsCenter()
                            padding(left = 16f, right = 16f, top = 14f, bottom = 14f)
                            backgroundColor(
                                if (ctx.selectedItem == item) Color(0xFFE3F2FD) else Color.WHITE
                            )
                        }
                        event {
                            click {
                                ctx.selectedItem = item
                            }
                        }

                        View {
                            attr {
                                size(28f, 28f)
                                backgroundColor(
                                    if (ctx.selectedItem == item) Color(0xFF2196F3) else Color(0xFFE0E0E0)
                                )
                                borderRadius(14f)
                                allCenter()
                                marginRight(12f)
                            }
                            Text {
                                attr {
                                    text("${index + 1}")
                                    fontSize(12f)
                                    color(
                                        if (ctx.selectedItem == item) Color.WHITE else Color(0xFF666666)
                                    )
                                    fontWeightBold()
                                }
                            }
                        }

                        Text {
                            attr {
                                text(item)
                                fontSize(15f)
                                flex(1f)
                                color(
                                    if (ctx.selectedItem == item) Color(0xFF1565C0) else Color.BLACK
                                )
                            }
                        }

                        if (ctx.selectedItem == item) {
                            Text {
                                attr {
                                    text("✓")
                                    fontSize(16f)
                                    color(Color(0xFF2196F3))
                                    fontWeightBold()
                                }
                            }
                        }
                    }

                    if (index < ctx.displayItems.size - 1) {
                        View {
                            attr {
                                height(0.5f)
                                backgroundColor(0xFFEEEEEE)
                                marginLeft(56f)
                            }
                        }
                    }
                }

                if (ctx.displayItems.isEmpty()) {
                    View {
                        attr {
                            allCenter()
                            padding(all = 40f)
                        }
                        Text {
                            attr {
                                text("no results")
                                fontSize(16f)
                                color(0xFF999999)
                            }
                        }
                    }
                }

                View {
                    attr {
                        height(50f)
                    }
                }
            }
        }
    }
}
