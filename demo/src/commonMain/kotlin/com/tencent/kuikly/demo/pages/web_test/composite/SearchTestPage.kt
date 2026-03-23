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
 * 组合场景测试：搜索场景
 *
 * 验证多组件协同：输入框 + 点击触发 + 列表结果渲染
 *
 * 测试覆盖：
 * 1. 搜索框输入 — Input 组件文本输入
 * 2. 搜索按钮点击 — 过滤固定数据集
 * 3. 结果列表渲染 — 按关键词过滤后更新列表
 * 4. 列表项点击 — 选中高亮并显示选中内容
 * 5. 清空搜索 — 恢复全量列表
 */
@Page("SearchTestPage")
internal class SearchTestPage : Pager() {

    companion object {
        // 固定搜索数据集，不依赖网络
        private val ALL_ITEMS = listOf(
            "Apple 苹果",
            "Banana 香蕉",
            "Cherry 樱桃",
            "Date 枣子",
            "Elderberry 接骨木莓",
            "Fig 无花果",
            "Grape 葡萄",
            "Honeydew 蜜瓜",
            "Kiwi 奇异果",
            "Lemon 柠檬",
            "Mango 芒果",
            "Nectarine 油桃",
            "Orange 橙子",
            "Papaya 木瓜",
            "Quince 榅桲",
            "Raspberry 覆盆子",
            "Strawberry 草莓",
            "Tangerine 橘子",
            "Ugli 丑橘",
            "Watermelon 西瓜"
        )
    }

    // === 响应式状态 ===
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

            // === 顶部搜索栏（固定在顶部，不在 List 内）===
            View {
                attr {
                    flexDirectionRow()
                    alignItemsCenter()
                    padding(left = 16f, right = 16f, top = 12f, bottom = 12f)
                    backgroundColor(Color.WHITE)
                }

                // 搜索输入框
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
                            placeholder("搜索水果...")
                            placeholderColor(Color(0xFF999999))
                        }
                        event {
                            textDidChange { params ->
                                ctx.searchText = params.text
                                // 输入时实时过滤
                                if (params.text.isEmpty()) {
                                    ctx.displayItems = ALL_ITEMS
                                    ctx.hasSearched = false
                                }
                            }
                        }
                    }
                }

                // 搜索按钮
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
                            text("搜索")
                            fontSize(14f)
                            color(Color.WHITE)
                            fontWeightBold()
                        }
                    }
                }
            }

            // === 搜索结果统计 ===
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
                                "找到 ${ctx.displayItems.size} 个结果"
                            else
                                "共 ${ctx.displayItems.size} 个水果"
                        )
                        fontSize(13f)
                        color(0xFF666666)
                    }
                }
                // 清空按钮（搜索过才显示）
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
                                text("清空")
                                fontSize(13f)
                                color(0xFF666666)
                            }
                        }
                    }
                }
            }

            // === 选中结果展示 ===
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
                            text("已选中: ${ctx.selectedItem}")
                            fontSize(14f)
                            color(Color(0xFF1565C0))
                            fontWeightBold()
                        }
                    }
                }
            }

            // === 结果列表 ===
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

                        // 序号
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

                        // 名称
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

                        // 选中图标
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

                    // 分隔线
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

                // 无结果提示
                if (ctx.displayItems.isEmpty()) {
                    View {
                        attr {
                            allCenter()
                            padding(all = 40f)
                        }
                        Text {
                            attr {
                                text("未找到相关水果")
                                fontSize(16f)
                                color(0xFF999999)
                            }
                        }
                    }
                }

                // 底部间距
                View {
                    attr {
                        height(50f)
                    }
                }
            }
        }
    }
}
