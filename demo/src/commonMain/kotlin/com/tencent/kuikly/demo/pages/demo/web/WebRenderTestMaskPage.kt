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
import com.tencent.kuikly.core.views.Image
import com.tencent.kuikly.core.views.List
import com.tencent.kuikly.core.views.Mask
import com.tencent.kuikly.core.views.Text
import com.tencent.kuikly.core.views.View
import com.tencent.kuikly.demo.pages.base.BasePager

/**
 * KRMaskView 全属性测试页面
 * 覆盖：遮罩效果，包括图片遮罩、渐变遮罩等
 */
@Page("WebRenderTestMask")
internal class WebRenderTestMaskPage : BasePager() {

    // 测试图片URL
    private val testImageUrl = "https://picsum.photos/400/300"

    override fun body(): ViewBuilder {
        val ctx = this

        return {
            attr {
                backgroundColor(Color.WHITE)
            }

            List {
                attr {
                    flex(1f)
                }

                // 标题
                View {
                    attr {
                        padding(16f)
                        backgroundColor(Color(0xFFFF9800))
                    }
                    Text {
                        attr {
                            text("MaskView 测试")
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
                        backgroundColor(Color(0xFFFFF3E0))
                        borderRadius(8f)
                    }
                    Text {
                        attr {
                            text("📝 MaskView 是遮罩容器组件，\n可以将子视图作为遮罩形状应用到内容上。\n常用于创建不规则形状的UI元素。")
                            fontSize(13f)
                            color(Color(0xFFE65100))
                            lineHeight(20f)
                        }
                    }
                }

                // 测试1: 基础遮罩效果
                View {
                    attr {
                        margin(12f)
                        padding(12f)
                        backgroundColor(Color(0xFFF5F5F5))
                        borderRadius(8f)
                    }
                    Text {
                        attr {
                            text("1. 基础遮罩效果")
                            fontSize(14f)
                            fontWeightBold()
                            color(Color(0xFF333333))
                            marginBottom(12f)
                        }
                    }
                    View {
                        attr {
                            height(150f)
                            backgroundColor(Color.WHITE)
                            borderRadius(8f)
                            overflow("hidden")
                            alignItemsCenter()
                            justifyContentCenter()
                        }
                        Mask {
                            attr {
                                size(200f, 120f)
                            }
                            // 被遮罩的内容
                            Image {
                                attr {
                                    absoluteFill()
                                    src(ctx.testImageUrl)
                                    resizeMode("cover")
                                }
                            }
                        }
                    }
                }

                // 测试2: 圆形遮罩
                View {
                    attr {
                        margin(12f)
                        padding(12f)
                        backgroundColor(Color(0xFFF5F5F5))
                        borderRadius(8f)
                    }
                    Text {
                        attr {
                            text("2. 圆形遮罩 (头像效果)")
                            fontSize(14f)
                            fontWeightBold()
                            color(Color(0xFF333333))
                            marginBottom(12f)
                        }
                    }
                    View {
                        attr {
                            flexDirectionRow()
                            justifyContentSpaceAround()
                            alignItemsCenter()
                            padding(16f)
                            backgroundColor(Color.WHITE)
                            borderRadius(8f)
                        }
                        // 小头像
                        View {
                            attr {
                                alignItemsCenter()
                            }
                            View {
                                attr {
                                    size(60f, 60f)
                                    borderRadius(30f)
                                    overflow("hidden")
                                }
                                Image {
                                    attr {
                                        absoluteFill()
                                        src(ctx.testImageUrl)
                                        resizeMode("cover")
                                    }
                                }
                            }
                            Text {
                                attr {
                                    text("60x60")
                                    fontSize(12f)
                                    color(Color(0xFF999999))
                                    marginTop(8f)
                                }
                            }
                        }
                        // 中头像
                        View {
                            attr {
                                alignItemsCenter()
                            }
                            View {
                                attr {
                                    size(80f, 80f)
                                    borderRadius(40f)
                                    overflow("hidden")
                                }
                                Image {
                                    attr {
                                        absoluteFill()
                                        src(ctx.testImageUrl)
                                        resizeMode("cover")
                                    }
                                }
                            }
                            Text {
                                attr {
                                    text("80x80")
                                    fontSize(12f)
                                    color(Color(0xFF999999))
                                    marginTop(8f)
                                }
                            }
                        }
                        // 大头像
                        View {
                            attr {
                                alignItemsCenter()
                            }
                            View {
                                attr {
                                    size(100f, 100f)
                                    borderRadius(50f)
                                    overflow("hidden")
                                }
                                Image {
                                    attr {
                                        absoluteFill()
                                        src(ctx.testImageUrl)
                                        resizeMode("cover")
                                    }
                                }
                            }
                            Text {
                                attr {
                                    text("100x100")
                                    fontSize(12f)
                                    color(Color(0xFF999999))
                                    marginTop(8f)
                                }
                            }
                        }
                    }
                }

                // 测试3: 圆角遮罩
                View {
                    attr {
                        margin(12f)
                        padding(12f)
                        backgroundColor(Color(0xFFF5F5F5))
                        borderRadius(8f)
                    }
                    Text {
                        attr {
                            text("3. 不同圆角遮罩")
                            fontSize(14f)
                            fontWeightBold()
                            color(Color(0xFF333333))
                            marginBottom(12f)
                        }
                    }
                    View {
                        attr {
                            flexDirectionRow()
                            justifyContentSpaceAround()
                            padding(12f)
                            backgroundColor(Color.WHITE)
                            borderRadius(8f)
                        }
                        // 无圆角
                        View {
                            attr {
                                alignItemsCenter()
                            }
                            View {
                                attr {
                                    size(80f, 80f)
                                    borderRadius(0f)
                                    overflow("hidden")
                                }
                                Image {
                                    attr {
                                        absoluteFill()
                                        src(ctx.testImageUrl)
                                        resizeMode("cover")
                                    }
                                }
                            }
                            Text {
                                attr {
                                    text("0px")
                                    fontSize(12f)
                                    color(Color(0xFF999999))
                                    marginTop(8f)
                                }
                            }
                        }
                        // 小圆角
                        View {
                            attr {
                                alignItemsCenter()
                            }
                            View {
                                attr {
                                    size(80f, 80f)
                                    borderRadius(8f)
                                    overflow("hidden")
                                }
                                Image {
                                    attr {
                                        absoluteFill()
                                        src(ctx.testImageUrl)
                                        resizeMode("cover")
                                    }
                                }
                            }
                            Text {
                                attr {
                                    text("8px")
                                    fontSize(12f)
                                    color(Color(0xFF999999))
                                    marginTop(8f)
                                }
                            }
                        }
                        // 大圆角
                        View {
                            attr {
                                alignItemsCenter()
                            }
                            View {
                                attr {
                                    size(80f, 80f)
                                    borderRadius(20f)
                                    overflow("hidden")
                                }
                                Image {
                                    attr {
                                        absoluteFill()
                                        src(ctx.testImageUrl)
                                        resizeMode("cover")
                                    }
                                }
                            }
                            Text {
                                attr {
                                    text("20px")
                                    fontSize(12f)
                                    color(Color(0xFF999999))
                                    marginTop(8f)
                                }
                            }
                        }
                    }
                }

                // 测试4: 渐变遮罩效果 (使用 maskLinearGradient)
                View {
                    attr {
                        margin(12f)
                        padding(12f)
                        backgroundColor(Color(0xFFF5F5F5))
                        borderRadius(8f)
                    }
                    Text {
                        attr {
                            text("4. 渐变遮罩效果")
                            fontSize(14f)
                            fontWeightBold()
                            color(Color(0xFF333333))
                            marginBottom(12f)
                        }
                    }
                    View {
                        attr {
                            height(150f)
                            borderRadius(8f)
                            overflow("hidden")
                        }
                        Image {
                            attr {
                                absoluteFill()
                                src(ctx.testImageUrl)
                                resizeMode("cover")
                            }
                        }
                        // 底部渐变遮罩
                        View {
                            attr {
                                position("absolute")
                                left(0f)
                                right(0f)
                                bottom(0f)
                                height(80f)
                                backgroundImage("linear-gradient(to bottom, transparent, rgba(0,0,0,0.8))")
                                justifyContentEnd()
                                padding(12f)
                            }
                            Text {
                                attr {
                                    text("渐变遮罩上的文字")
                                    fontSize(14f)
                                    fontWeightBold()
                                    color(Color.WHITE)
                                }
                            }
                        }
                    }
                }

                // 测试5: 多层遮罩叠加
                View {
                    attr {
                        margin(12f)
                        padding(12f)
                        backgroundColor(Color(0xFFF5F5F5))
                        borderRadius(8f)
                    }
                    Text {
                        attr {
                            text("5. 多层遮罩叠加")
                            fontSize(14f)
                            fontWeightBold()
                            color(Color(0xFF333333))
                            marginBottom(12f)
                        }
                    }
                    View {
                        attr {
                            height(150f)
                            borderRadius(8f)
                            overflow("hidden")
                        }
                        // 背景图片
                        Image {
                            attr {
                                absoluteFill()
                                src(ctx.testImageUrl)
                                resizeMode("cover")
                            }
                        }
                        // 半透明颜色遮罩
                        View {
                            attr {
                                absoluteFill()
                                backgroundColor(Color(0x66000000))
                            }
                        }
                        // 内容
                        View {
                            attr {
                                absoluteFill()
                                alignItemsCenter()
                                justifyContentCenter()
                            }
                            Text {
                                attr {
                                    text("多层遮罩效果")
                                    fontSize(20f)
                                    fontWeightBold()
                                    color(Color.WHITE)
                                }
                            }
                            Text {
                                attr {
                                    text("图片 + 半透明黑色遮罩")
                                    fontSize(13f)
                                    color(Color(0xCCFFFFFF.toInt()))
                                    marginTop(8f)
                                }
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
                            text("6. 遮罩实现方式说明")
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
                                    |• Mask 组件 - 形状遮罩
                                    |  - 将子视图作为遮罩形状
                                    |
                                    |• borderRadius + overflow
                                    |  - 圆角遮罩效果
                                    |  - overflow("hidden") 必须设置
                                    |
                                    |• maskLinearGradient - 渐变遮罩
                                    |  - CSS mask 属性
                                    |  - 支持线性渐变遮罩
                                    |
                                    |• 半透明背景色 - 颜色遮罩
                                    |  - 使用 ARGB 颜色值
                                    |  - 如: 0x66000000 (40%黑色)
                                    |
                                    |• 常见应用场景:
                                    |  - 圆形头像
                                    |  - 图片卡片
                                    |  - 底部渐变文字区域
                                    |  - 禁用状态遮罩
                                """.trimMargin())
                                fontSize(12f)
                                color(Color(0xFF666666))
                                lineHeight(18f)
                            }
                        }
                    }
                }

                // 底部留白
                View {
                    attr {
                        height(50f)
                    }
                }
            }
        }
    }
}
