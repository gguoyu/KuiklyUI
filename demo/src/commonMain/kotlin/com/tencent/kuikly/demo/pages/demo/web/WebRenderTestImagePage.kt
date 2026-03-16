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
import com.tencent.kuikly.core.base.ViewContainer
import com.tencent.kuikly.core.reactive.handler.observable
import com.tencent.kuikly.core.views.Image
import com.tencent.kuikly.core.views.List
import com.tencent.kuikly.core.views.Text
import com.tencent.kuikly.core.views.View
import com.tencent.kuikly.demo.pages.base.BasePager

/**
 * KRImageView 全属性测试页面
 * 覆盖以下属性：
 * - src (URL/base64)
 * - resize (stretch/contain/cover)
 * - tintColor
 * - blurRadius
 * - loadSuccess/loadFailure/loadResolution 回调
 */
@Page("WebRenderTestImage")
internal class WebRenderTestImagePage : BasePager() {

    // 加载状态记录
    private var loadStatus1 by observable("loading...")
    private var loadStatus2 by observable("loading...")
    private var loadStatusFail by observable("loading...")
    private var imageResolution by observable("--")

    override fun body(): ViewBuilder {
        val ctx = this
        return {
            attr {
                backgroundColor(Color.WHITE)
            }

            // 标题栏
            View {
                attr {
                    height(44f)
                    backgroundColor(Color(0xFF4A90E2))
                    justifyContentCenter()
                    alignItemsCenter()
                }
                Text {
                    attr {
                        text("Image组件属性测试")
                        fontSize(18f)
                        color(Color.WHITE)
                        fontWeight700()
                    }
                }
            }

            List {
                attr {
                    flex(1f)
                }

                // ========== 1. src - 网络URL ==========
                SectionHeader("1. src - 网络图片URL")
                View {
                    attr {
                        height(150f)
                        margin(10f)
                        backgroundColor(Color(0xFFEEEEEE))
                        borderRadius(8f)
                        padding(10f)
                    }
                    View {
                        attr {
                            flexDirectionRow()
                            alignItemsCenter()
                        }
                        Image {
                            attr {
                                size(120f, 120f)
                                src("https://vfiles.gtimg.cn/wuji_dashboard/xy/starter/c498f4b4.jpg")
                                borderRadius(8f)
                            }
                            event {
                                loadSuccess {
                                    ctx.loadStatus1 = "加载成功"
                                }
                                loadFailure {
                                    ctx.loadStatus1 = "加载失败"
                                }
                            }
                        }
                        View {
                            attr {
                                flex(1f)
                                marginLeft(15f)
                            }
                            Text {
                                attr {
                                    text("网络URL图片")
                                    fontSize(14f)
                                    color(Color(0xFF333333))
                                }
                            }
                            Text {
                                attr {
                                    text("状态: ${ctx.loadStatus1}")
                                    fontSize(12f)
                                    color(Color(0xFF666666))
                                    marginTop(5f)
                                }
                            }
                        }
                    }
                }

                // ========== 2. src - Base64 ==========
                SectionHeader("2. src - Base64图片")
                View {
                    attr {
                        height(130f)
                        margin(10f)
                        backgroundColor(Color(0xFFEEEEEE))
                        borderRadius(8f)
                        padding(10f)
                    }
                    View {
                        attr {
                            flexDirectionRow()
                            alignItemsCenter()
                        }
                        // 一个简单的红色方块 base64
                        Image {
                            attr {
                                size(80f, 80f)
                                // 1x1 红色像素 PNG base64
                                src("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==")
                                borderRadius(8f)
                                backgroundColor(Color(0xFFFF0000))
                            }
                        }
                        View {
                            attr {
                                flex(1f)
                                marginLeft(15f)
                            }
                            Text {
                                attr {
                                    text("Base64编码图片")
                                    fontSize(14f)
                                    color(Color(0xFF333333))
                                }
                            }
                            Text {
                                attr {
                                    text("data:image/png;base64,...")
                                    fontSize(10f)
                                    color(Color(0xFF999999))
                                    marginTop(5f)
                                }
                            }
                        }
                    }
                }

                // ========== 3. resize 模式对比 ==========
                SectionHeader("3. resize - 缩放模式")
                View {
                    attr {
                        margin(10f)
                        backgroundColor(Color(0xFFEEEEEE))
                        borderRadius(8f)
                        padding(10f)
                    }
                    // stretch 模式
                    View {
                        attr {
                            flexDirectionRow()
                            alignItemsCenter()
                            marginBottom(10f)
                        }
                        View {
                            attr {
                                size(100f, 60f)
                                backgroundColor(Color(0xFFCCCCCC))
                            }
                            Image {
                                attr {
                                    absolutePositionAllZero()
                                    src("https://vfiles.gtimg.cn/wuji_dashboard/xy/componenthub/Dfnp7Q9F.png")
                                    resizeStretch()
                                }
                            }
                        }
                        Text {
                            attr {
                                text("stretch - 拉伸填充")
                                fontSize(12f)
                                color(Color(0xFF333333))
                                marginLeft(15f)
                            }
                        }
                    }
                    // contain 模式
                    View {
                        attr {
                            flexDirectionRow()
                            alignItemsCenter()
                            marginBottom(10f)
                        }
                        View {
                            attr {
                                size(100f, 60f)
                                backgroundColor(Color(0xFFCCCCCC))
                            }
                            Image {
                                attr {
                                    absolutePositionAllZero()
                                    src("https://vfiles.gtimg.cn/wuji_dashboard/xy/componenthub/Dfnp7Q9F.png")
                                    resizeContain()
                                }
                            }
                        }
                        Text {
                            attr {
                                text("contain - 等比缩放包含")
                                fontSize(12f)
                                color(Color(0xFF333333))
                                marginLeft(15f)
                            }
                        }
                    }
                    // cover 模式
                    View {
                        attr {
                            flexDirectionRow()
                            alignItemsCenter()
                        }
                        View {
                            attr {
                                size(100f, 60f)
                                backgroundColor(Color(0xFFCCCCCC))
                                overflow(false)
                            }
                            Image {
                                attr {
                                    absolutePositionAllZero()
                                    src("https://vfiles.gtimg.cn/wuji_dashboard/xy/componenthub/Dfnp7Q9F.png")
                                    resizeCover()
                                }
                            }
                        }
                        Text {
                            attr {
                                text("cover - 等比缩放覆盖")
                                fontSize(12f)
                                color(Color(0xFF333333))
                                marginLeft(15f)
                            }
                        }
                    }
                }

                // ========== 4. tintColor ==========
                SectionHeader("4. tintColor - 着色")
                View {
                    attr {
                        height(100f)
                        margin(10f)
                        backgroundColor(Color(0xFFEEEEEE))
                        borderRadius(8f)
                        flexDirectionRow()
                        justifyContentSpaceEvenly()
                        alignItemsCenter()
                    }
                    // 原图
                    View {
                        attr {
                            alignItemsCenter()
                        }
                        Image {
                            attr {
                                size(60f, 60f)
                                src("https://vfiles.gtimg.cn/wuji_dashboard/xy/componenthub/Dfnp7Q9F.png")
                                resizeContain()
                            }
                        }
                        Text {
                            attr {
                                text("原图")
                                fontSize(10f)
                                color(Color(0xFF666666))
                                marginTop(5f)
                            }
                        }
                    }
                    // 红色着色
                    View {
                        attr {
                            alignItemsCenter()
                        }
                        Image {
                            attr {
                                size(60f, 60f)
                                src("https://vfiles.gtimg.cn/wuji_dashboard/xy/componenthub/Dfnp7Q9F.png")
                                resizeContain()
                                tintColor(Color.RED)
                            }
                        }
                        Text {
                            attr {
                                text("红色")
                                fontSize(10f)
                                color(Color(0xFF666666))
                                marginTop(5f)
                            }
                        }
                    }
                    // 蓝色着色
                    View {
                        attr {
                            alignItemsCenter()
                        }
                        Image {
                            attr {
                                size(60f, 60f)
                                src("https://vfiles.gtimg.cn/wuji_dashboard/xy/componenthub/Dfnp7Q9F.png")
                                resizeContain()
                                tintColor(Color.BLUE)
                            }
                        }
                        Text {
                            attr {
                                text("蓝色")
                                fontSize(10f)
                                color(Color(0xFF666666))
                                marginTop(5f)
                            }
                        }
                    }
                    // 绿色着色
                    View {
                        attr {
                            alignItemsCenter()
                        }
                        Image {
                            attr {
                                size(60f, 60f)
                                src("https://vfiles.gtimg.cn/wuji_dashboard/xy/componenthub/Dfnp7Q9F.png")
                                resizeContain()
                                tintColor(Color(0xFF50C878))
                            }
                        }
                        Text {
                            attr {
                                text("绿色")
                                fontSize(10f)
                                color(Color(0xFF666666))
                                marginTop(5f)
                            }
                        }
                    }
                }

                // ========== 5. blurRadius ==========
                SectionHeader("5. blurRadius - 模糊半径")
                View {
                    attr {
                        height(120f)
                        margin(10f)
                        backgroundColor(Color(0xFFEEEEEE))
                        borderRadius(8f)
                        flexDirectionRow()
                        justifyContentSpaceEvenly()
                        alignItemsCenter()
                    }
                    // 无模糊
                    View {
                        attr {
                            alignItemsCenter()
                        }
                        Image {
                            attr {
                                size(80f, 80f)
                                src("https://vfiles.gtimg.cn/wuji_dashboard/xy/starter/c498f4b4.jpg")
                                borderRadius(8f)
                            }
                        }
                        Text {
                            attr {
                                text("0")
                                fontSize(10f)
                                color(Color(0xFF666666))
                                marginTop(5f)
                            }
                        }
                    }
                    // 模糊5
                    View {
                        attr {
                            alignItemsCenter()
                        }
                        Image {
                            attr {
                                size(80f, 80f)
                                src("https://vfiles.gtimg.cn/wuji_dashboard/xy/starter/c498f4b4.jpg")
                                borderRadius(8f)
                                blurRadius(5f)
                            }
                        }
                        Text {
                            attr {
                                text("5")
                                fontSize(10f)
                                color(Color(0xFF666666))
                                marginTop(5f)
                            }
                        }
                    }
                    // 模糊15
                    View {
                        attr {
                            alignItemsCenter()
                        }
                        Image {
                            attr {
                                size(80f, 80f)
                                src("https://vfiles.gtimg.cn/wuji_dashboard/xy/starter/c498f4b4.jpg")
                                borderRadius(8f)
                                blurRadius(15f)
                            }
                        }
                        Text {
                            attr {
                                text("15")
                                fontSize(10f)
                                color(Color(0xFF666666))
                                marginTop(5f)
                            }
                        }
                    }
                    // 模糊25
                    View {
                        attr {
                            alignItemsCenter()
                        }
                        Image {
                            attr {
                                size(80f, 80f)
                                src("https://vfiles.gtimg.cn/wuji_dashboard/xy/starter/c498f4b4.jpg")
                                borderRadius(8f)
                                blurRadius(25f)
                            }
                        }
                        Text {
                            attr {
                                text("25")
                                fontSize(10f)
                                color(Color(0xFF666666))
                                marginTop(5f)
                            }
                        }
                    }
                }

                // ========== 6. 加载回调测试 ==========
                SectionHeader("6. 加载回调 - loadSuccess/loadFailure")
                View {
                    attr {
                        margin(10f)
                        backgroundColor(Color(0xFFEEEEEE))
                        borderRadius(8f)
                        padding(10f)
                    }
                    // 成功加载
                    View {
                        attr {
                            flexDirectionRow()
                            alignItemsCenter()
                            marginBottom(10f)
                        }
                        Image {
                            attr {
                                size(60f, 60f)
                                src("https://vfiles.gtimg.cn/wuji_dashboard/xy/starter/c498f4b4.jpg")
                                borderRadius(8f)
                            }
                            event {
                                loadSuccess {
                                    ctx.loadStatus2 = "✓ 加载成功"
                                }
                                loadFailure {
                                    ctx.loadStatus2 = "✗ 加载失败"
                                }
                                loadResolution { params ->
                                    ctx.imageResolution = "${params.width}x${params.height}"
                                }
                            }
                        }
                        View {
                            attr {
                                flex(1f)
                                marginLeft(15f)
                            }
                            Text {
                                attr {
                                    text("有效URL: ${ctx.loadStatus2}")
                                    fontSize(12f)
                                    color(Color(0xFF333333))
                                }
                            }
                            Text {
                                attr {
                                    text("分辨率: ${ctx.imageResolution}")
                                    fontSize(12f)
                                    color(Color(0xFF666666))
                                    marginTop(3f)
                                }
                            }
                        }
                    }
                    // 失败加载
                    View {
                        attr {
                            flexDirectionRow()
                            alignItemsCenter()
                        }
                        Image {
                            attr {
                                size(60f, 60f)
                                src("https://invalid-url-that-does-not-exist.com/image.png")
                                borderRadius(8f)
                                backgroundColor(Color(0xFFCCCCCC))
                            }
                            event {
                                loadSuccess {
                                    ctx.loadStatusFail = "✓ 加载成功"
                                }
                                loadFailure {
                                    ctx.loadStatusFail = "✗ 加载失败"
                                }
                            }
                        }
                        View {
                            attr {
                                flex(1f)
                                marginLeft(15f)
                            }
                            Text {
                                attr {
                                    text("无效URL: ${ctx.loadStatusFail}")
                                    fontSize(12f)
                                    color(Color(0xFF333333))
                                }
                            }
                        }
                    }
                }

                // ========== 7. 九宫格拉伸 ==========
                SectionHeader("7. 九宫格图片 (dotNineImage)")
                View {
                    attr {
                        height(100f)
                        margin(10f)
                        backgroundColor(Color(0xFFEEEEEE))
                        borderRadius(8f)
                        flexDirectionRow()
                        alignItemsCenter()
                        padding(10f)
                    }
                    Image {
                        attr {
                            size(200f, 60f)
                            src("https://vfiles.gtimg.cn/wuji_dashboard/xy/componenthub/gjCqDSbr.png", true)
                        }
                    }
                    Text {
                        attr {
                            text(".9图拉伸")
                            fontSize(12f)
                            color(Color(0xFF666666))
                            marginLeft(15f)
                        }
                    }
                }

                // 底部占位
                View {
                    attr {
                        height(50f)
                    }
                }
            }
        }
    }

    // 辅助方法：Section 标题
    private fun ViewContainer<*, *>.SectionHeader(title: String) {
        View {
            attr {
                padding(left = 10f, top = 15f, bottom = 5f)
            }
            Text {
                attr {
                    text(title)
                    fontSize(14f)
                    color(Color(0xFF333333))
                    fontWeight700()
                }
            }
        }
    }
}
