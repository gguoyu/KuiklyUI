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
import com.tencent.kuikly.core.views.Blur
import com.tencent.kuikly.core.views.Image
import com.tencent.kuikly.core.views.List
import com.tencent.kuikly.core.views.Text
import com.tencent.kuikly.core.views.View
import com.tencent.kuikly.demo.pages.base.BasePager

/**
 * KRBlurView 全属性测试页面
 * 覆盖：blurRadius 不同模糊半径的效果对比
 */
@Page("WebRenderTestBlur")
internal class WebRenderTestBlurPage : BasePager() {

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
                        backgroundColor(Color(0xFF9C27B0))
                    }
                    Text {
                        attr {
                            text("BlurView 测试")
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
                        backgroundColor(Color(0xFFF3E5F5))
                        borderRadius(8f)
                    }
                    Text {
                        attr {
                            text("📝 BlurView 是模糊效果组件，\n通过 blurRadius 属性控制模糊程度。\n数值越大，模糊效果越强。")
                            fontSize(13f)
                            color(Color(0xFF7B1FA2))
                            lineHeight(20f)
                        }
                    }
                }

                // 测试1: blurRadius = 0 (无模糊)
                BlurTestSection("1. blurRadius = 0 (无模糊)", 0f)

                // 测试2: blurRadius = 5 (轻微模糊)
                BlurTestSection("2. blurRadius = 5 (轻微模糊)", 5f)

                // 测试3: blurRadius = 10 (中等模糊)
                BlurTestSection("3. blurRadius = 10 (中等模糊)", 10f)

                // 测试4: blurRadius = 20 (强模糊)
                BlurTestSection("4. blurRadius = 20 (强模糊)", 20f)

                // 测试5: blurRadius = 50 (极强模糊)
                BlurTestSection("5. blurRadius = 50 (极强模糊)", 50f)

                // 测试6: 实际应用 - 毛玻璃效果
                View {
                    attr {
                        margin(12f)
                        padding(12f)
                        backgroundColor(Color(0xFFF5F5F5))
                        borderRadius(8f)
                    }
                    Text {
                        attr {
                            text("6. 实际应用 - 毛玻璃效果")
                            fontSize(14f)
                            fontWeightBold()
                            color(Color(0xFF333333))
                            marginBottom(12f)
                        }
                    }
                    View {
                        attr {
                            height(200f)
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
                        // 毛玻璃覆盖层
                        View {
                            attr {
                                position("absolute")
                                left(0f)
                                right(0f)
                                bottom(0f)
                                height(80f)
                            }
                            Blur {
                                attr {
                                    absoluteFill()
                                    blurRadius(15f)
                                }
                            }
                            // 文字内容 (在模糊层上方)
                            View {
                                attr {
                                    absoluteFill()
                                    padding(16f)
                                    justifyContentCenter()
                                }
                                Text {
                                    attr {
                                        text("毛玻璃效果标题")
                                        fontSize(18f)
                                        fontWeightBold()
                                        color(Color.WHITE)
                                    }
                                }
                                Text {
                                    attr {
                                        text("这是一段描述文字，展示在毛玻璃效果之上")
                                        fontSize(13f)
                                        color(Color(0xDDFFFFFF.toInt()))
                                        marginTop(4f)
                                    }
                                }
                            }
                        }
                    }
                }

                // 测试7: 纯色背景模糊对比
                View {
                    attr {
                        margin(12f)
                        padding(12f)
                        backgroundColor(Color(0xFFF5F5F5))
                        borderRadius(8f)
                    }
                    Text {
                        attr {
                            text("7. 纯色背景模糊对比")
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
                        }
                        // 无模糊
                        View {
                            attr {
                                alignItemsCenter()
                            }
                            View {
                                attr {
                                    size(80f, 80f)
                                    backgroundColor(Color(0xFF2196F3))
                                    borderRadius(8f)
                                }
                            }
                            Text {
                                attr {
                                    text("无模糊")
                                    fontSize(12f)
                                    color(Color(0xFF666666))
                                    marginTop(8f)
                                }
                            }
                        }
                        // 轻度模糊
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
                                View {
                                    attr {
                                        absoluteFill()
                                        backgroundColor(Color(0xFF2196F3))
                                    }
                                }
                                Blur {
                                    attr {
                                        absoluteFill()
                                        blurRadius(5f)
                                    }
                                }
                            }
                            Text {
                                attr {
                                    text("blur=5")
                                    fontSize(12f)
                                    color(Color(0xFF666666))
                                    marginTop(8f)
                                }
                            }
                        }
                        // 强模糊
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
                                View {
                                    attr {
                                        absoluteFill()
                                        backgroundColor(Color(0xFF2196F3))
                                    }
                                }
                                Blur {
                                    attr {
                                        absoluteFill()
                                        blurRadius(20f)
                                    }
                                }
                            }
                            Text {
                                attr {
                                    text("blur=20")
                                    fontSize(12f)
                                    color(Color(0xFF666666))
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
                            text("8. 属性说明")
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
                                    |• blurRadius - 模糊半径
                                    |  - 0: 无模糊效果
                                    |  - 1-5: 轻微模糊
                                    |  - 5-15: 中等模糊 (常用)
                                    |  - 15-30: 强模糊
                                    |  - >30: 极强模糊
                                    |
                                    |• 使用建议:
                                    |  - 毛玻璃效果: 10-20
                                    |  - 背景模糊: 15-25
                                    |  - 隐私遮罩: 30+
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

    private fun ViewBuilder.BlurTestSection(title: String, blurRadius: Float) {
        val ctx = this@WebRenderTestBlurPage
        View {
            attr {
                margin(12f)
                padding(12f)
                backgroundColor(Color(0xFFF5F5F5))
                borderRadius(8f)
            }
            Text {
                attr {
                    text(title)
                    fontSize(14f)
                    fontWeightBold()
                    color(Color(0xFF333333))
                    marginBottom(12f)
                }
            }
            View {
                attr {
                    height(120f)
                    borderRadius(8f)
                    overflow("hidden")
                }
                // 背景内容
                Image {
                    attr {
                        absoluteFill()
                        src(ctx.testImageUrl)
                        resizeMode("cover")
                    }
                }
                // 模糊层
                if (blurRadius > 0f) {
                    Blur {
                        attr {
                            absoluteFill()
                            blurRadius(blurRadius)
                        }
                    }
                }
            }
        }
    }
}
