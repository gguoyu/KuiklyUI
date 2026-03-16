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

package com.tencent.kuikly.demo.pages.demo.web

import com.tencent.kuikly.core.annotations.Page
import com.tencent.kuikly.core.base.Color
import com.tencent.kuikly.core.base.ViewBuilder
import com.tencent.kuikly.core.views.Hover
import com.tencent.kuikly.core.views.List
import com.tencent.kuikly.core.views.Text
import com.tencent.kuikly.core.views.View
import com.tencent.kuikly.demo.pages.base.BasePager

/**
 * KRHoverView 全属性测试页面
 * 覆盖：hoverMarginTop、bringIndex 属性
 * 用于实现吸顶效果
 */
@Page("WebRenderTestHover")
internal class WebRenderTestHoverPage : BasePager() {

    override fun body(): ViewBuilder {
        return {
            attr {
                backgroundColor(Color.WHITE)
            }

            List {
                attr {
                    flex(1f)
                }

                // 标题（不吸顶）
                View {
                    attr {
                        padding(16f)
                        backgroundColor(Color(0xFF3F51B5))
                    }
                    Text {
                        attr {
                            text("HoverView 测试")
                            fontSize(20f)
                            fontWeightBold()
                            color(Color.WHITE)
                        }
                    }
                }

                // 说明
                View {
                    attr {
                        margin(12f)
                        padding(12f)
                        backgroundColor(Color(0xFFE8EAF6))
                        borderRadius(8f)
                    }
                    Text {
                        attr {
                            text("📝 HoverView 是吸顶组件，当滚动到指定位置时会固定在顶部。\n请向下滚动查看吸顶效果。")
                            fontSize(13f)
                            color(Color(0xFF303F9F))
                            lineHeight(20f)
                        }
                    }
                }

                // 间隔内容
                ContentBlock("内容区块 1", Color(0xFFFFEBEE), "向下滚动查看吸顶效果")
                ContentBlock("内容区块 2", Color(0xFFE3F2FD), "继续滚动...")

                // 吸顶组件1 - hoverMarginTop = 0
                Hover {
                    attr {
                        hoverMarginTop(0f)
                    }
                    View {
                        attr {
                            backgroundColor(Color(0xFFFF5722))
                            padding(12f)
                        }
                        Text {
                            attr {
                                text("🔝 吸顶组件1 (hoverMarginTop = 0)")
                                fontSize(14f)
                                fontWeightBold()
                                color(Color.WHITE)
                            }
                        }
                        Text {
                            attr {
                                text("这个组件会固定在顶部 (0px)")
                                fontSize(12f)
                                color(Color(0xFFFFCCBC))
                                marginTop(4f)
                            }
                        }
                    }
                }

                // 更多间隔内容
                ContentBlock("内容区块 3", Color(0xFFF3E5F5), "第一个吸顶组件已固定")
                ContentBlock("内容区块 4", Color(0xFFE8F5E9), "继续滚动...")
                ContentBlock("内容区块 5", Color(0xFFFFF3E0), "即将出现第二个吸顶组件")

                // 吸顶组件2 - hoverMarginTop = 48 (在第一个吸顶组件下方)
                Hover {
                    attr {
                        hoverMarginTop(48f)
                    }
                    View {
                        attr {
                            backgroundColor(Color(0xFF4CAF50))
                            padding(12f)
                        }
                        Text {
                            attr {
                                text("🔝 吸顶组件2 (hoverMarginTop = 48)")
                                fontSize(14f)
                                fontWeightBold()
                                color(Color.WHITE)
                            }
                        }
                        Text {
                            attr {
                                text("这个组件会固定在顶部 48px 处")
                                fontSize(12f)
                                color(Color(0xFFC8E6C9))
                                marginTop(4f)
                            }
                        }
                    }
                }

                // 更多间隔内容
                ContentBlock("内容区块 6", Color(0xFFE0F7FA), "两个吸顶组件可以叠加")
                ContentBlock("内容区块 7", Color(0xFFFCE4EC), "继续滚动查看效果")
                ContentBlock("内容区块 8", Color(0xFFF5F5F5), "即将出现第三个吸顶组件")

                // 吸顶组件3 - 带有更高的 hoverMarginTop
                Hover {
                    attr {
                        hoverMarginTop(100f)
                    }
                    View {
                        attr {
                            backgroundColor(Color(0xFF2196F3))
                            padding(12f)
                        }
                        Text {
                            attr {
                                text("🔝 吸顶组件3 (hoverMarginTop = 100)")
                                fontSize(14f)
                                fontWeightBold()
                                color(Color.WHITE)
                            }
                        }
                        Text {
                            attr {
                                text("这个组件会固定在顶部 100px 处")
                                fontSize(12f)
                                color(Color(0xFFBBDEFB))
                                marginTop(4f)
                            }
                        }
                    }
                }

                // 属性说明
                View {
                    attr {
                        margin(12f)
                        padding(12f)
                        backgroundColor(Color(0xFFF5F5F5))
                        borderRadius(8f)
                    }
                    Text {
                        attr {
                            text("属性说明")
                            fontSize(14f)
                            fontWeightBold()
                            color(Color(0xFF333333))
                            marginBottom(8f)
                        }
                    }
                    View {
                        attr {
                            padding(8f)
                            backgroundColor(Color.WHITE)
                            borderRadius(4f)
                        }
                        Text {
                            attr {
                                text("""
                                    |• hoverMarginTop - 吸顶位置
                                    |  - 0: 固定在最顶部
                                    |  - 正值: 距离顶部的偏移量(px)
                                    |  - 可实现多级吸顶叠加效果
                                    |
                                    |• bringIndex - 层级控制
                                    |  - 控制多个吸顶组件的叠加顺序
                                    |  - 数值越大，层级越高
                                    |
                                    |• 使用场景:
                                    |  - 导航栏吸顶
                                    |  - 分类标签吸顶
                                    |  - 筛选条件吸顶
                                    |  - 播放器小窗吸顶
                                """.trimMargin())
                                fontSize(12f)
                                color(Color(0xFF666666))
                                lineHeight(18f)
                            }
                        }
                    }
                }

                // 更多填充内容
                repeat(10) { index ->
                    ContentBlock(
                        "填充内容 ${index + 1}",
                        if (index % 2 == 0) Color(0xFFFAFAFA) else Color(0xFFF5F5F5),
                        "滚动查看吸顶效果变化"
                    )
                }

                // 底部留白
                View {
                    attr {
                        height(100f)
                    }
                }
            }
        }
    }

    private fun ViewBuilder.ContentBlock(title: String, bgColor: Color, description: String) {
        View {
            attr {
                margin(12f)
                padding(20f)
                backgroundColor(bgColor)
                borderRadius(8f)
            }
            Text {
                attr {
                    text(title)
                    fontSize(16f)
                    fontWeightBold()
                    color(Color(0xFF333333))
                }
            }
            Text {
                attr {
                    text(description)
                    fontSize(13f)
                    color(Color(0xFF666666))
                    marginTop(8f)
                }
            }
        }
    }
}
