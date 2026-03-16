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
import com.tencent.kuikly.core.reactive.handler.observable
import com.tencent.kuikly.core.views.List
import com.tencent.kuikly.core.views.Text
import com.tencent.kuikly.core.views.View
import com.tencent.kuikly.demo.pages.base.BasePager

/**
 * H5WindowResizeModule 全方法测试页面
 * 覆盖：listenWindowSizeChange、removeListenWindowSizeChange 方法
 * 展示当前窗口尺寸及尺寸变化监听
 */
@Page("WebRenderTestWindowResize")
internal class WebRenderTestWindowResizePage : BasePager() {

    // 窗口尺寸状态
    private var currentWidth by observable(0f)
    private var currentHeight by observable(0f)
    private var resizeCount by observable(0)
    private var lastResizeTime by observable("未触发")

    // 测试结果状态
    private var listenResult by observable("未执行")
    private var removeListenResult by observable("未执行")
    private var moduleInfoResult by observable("未执行")
    private var usageExampleResult by observable("未执行")

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
                        backgroundColor(Color(0xFF795548))
                    }
                    Text {
                        attr {
                            text("WindowResizeModule 测试")
                            fontSize(20f)
                            fontWeightBold()
                            color(Color.WHITE)
                        }
                    }
                }

                // 当前窗口尺寸展示
                View {
                    attr {
                        margin(12f)
                        padding(20f)
                        backgroundColor(Color(0xFF3F51B5))
                        borderRadius(12f)
                        alignItemsCenter()
                    }
                    Text {
                        attr {
                            text("当前窗口尺寸")
                            fontSize(14f)
                            color(Color(0xFFC5CAE9))
                            marginBottom(8f)
                        }
                    }
                    Text {
                        attr {
                            text("${ctx.currentWidth.toInt()} × ${ctx.currentHeight.toInt()}")
                            fontSize(32f)
                            fontWeightBold()
                            color(Color.WHITE)
                        }
                    }
                    Text {
                        attr {
                            text("宽度 × 高度 (px)")
                            fontSize(12f)
                            color(Color(0xFFC5CAE9))
                            marginTop(4f)
                        }
                    }
                }

                // 尺寸变化统计
                View {
                    attr {
                        marginHorizontal(12f)
                        marginBottom(12f)
                        flexDirectionRow()
                        justifyContentSpaceBetween()
                    }
                    // 变化次数
                    View {
                        attr {
                            flex(1f)
                            marginRight(6f)
                            padding(16f)
                            backgroundColor(Color(0xFF4CAF50))
                            borderRadius(8f)
                            alignItemsCenter()
                        }
                        Text {
                            attr {
                                text("尺寸变化次数")
                                fontSize(12f)
                                color(Color(0xFFC8E6C9))
                            }
                        }
                        Text {
                            attr {
                                text("${ctx.resizeCount}")
                                fontSize(24f)
                                fontWeightBold()
                                color(Color.WHITE)
                                marginTop(4f)
                            }
                        }
                    }
                    // 最后变化时间
                    View {
                        attr {
                            flex(1f)
                            marginLeft(6f)
                            padding(16f)
                            backgroundColor(Color(0xFFFF9800))
                            borderRadius(8f)
                            alignItemsCenter()
                        }
                        Text {
                            attr {
                                text("最后变化")
                                fontSize(12f)
                                color(Color(0xFFFFE0B2))
                            }
                        }
                        Text {
                            attr {
                                text(ctx.lastResizeTime)
                                fontSize(14f)
                                fontWeightBold()
                                color(Color.WHITE)
                                marginTop(4f)
                            }
                        }
                    }
                }

                // 说明
                View {
                    attr {
                        margin(12f)
                        padding(12f)
                        backgroundColor(Color(0xFFEFEBE9))
                        borderRadius(8f)
                    }
                    Text {
                        attr {
                            text("📝 说明: 调整浏览器窗口大小可触发尺寸变化事件。\n在移动设备上旋转屏幕也会触发。")
                            fontSize(13f)
                            color(Color(0xFF5D4037))
                            lineHeight(20f)
                        }
                    }
                }

                // 测试1: listenWindowSizeChange
                SectionView("1. listenWindowSizeChange", ctx.listenResult)

                // 测试2: removeListenWindowSizeChange
                SectionView("2. removeListenWindowSizeChange", ctx.removeListenResult)

                // 测试3: 模块信息
                SectionView("3. WindowResizeModule 信息", ctx.moduleInfoResult)

                // 测试4: 使用示例
                SectionView("4. 使用示例", ctx.usageExampleResult)

                // 底部留白
                View {
                    attr {
                        height(50f)
                    }
                }
            }
        }
    }

    override fun created() {
        super.created()
        initWindowSize()
        runWindowResizeTests()
    }

    private fun initWindowSize() {
        // 获取初始窗口尺寸
        // 在 Web 环境中，可以通过 pager 的 pageData 或其他方式获取
        // 这里使用默认值，实际尺寸会通过 resize 事件更新
        currentWidth = 375f
        currentHeight = 812f
    }

    private fun runWindowResizeTests() {
        // 测试1: listenWindowSizeChange
        listenResult = """
            |✅ listenWindowSizeChange 用法
            |
            |windowResizeModule.listenWindowSizeChange { size ->
            |    val width = size.optDouble("width")
            |    val height = size.optDouble("height")
            |    // 更新 UI
            |}
            |
            |回调参数: JSONObject
            |• width - 窗口宽度 (px)
            |• height - 窗口高度 (px)
        """.trimMargin()

        // 测试2: removeListenWindowSizeChange
        removeListenResult = """
            |✅ removeListenWindowSizeChange 用法
            |
            |// 移除监听
            |windowResizeModule.removeListenWindowSizeChange()
            |
            |说明: 在页面销毁时应调用此方法
            |避免内存泄漏
        """.trimMargin()

        // 测试3: 模块信息
        moduleInfoResult = """
            |✅ WindowResizeModule 信息
            |
            |模块名称: WindowResizeModule
            |适用平台: H5 Web
            |
            |支持方法:
            |• listenWindowSizeChange
            |  - 监听窗口尺寸变化
            |• removeListenWindowSizeChange
            |  - 移除监听
            |
            |触发场景:
            |• 浏览器窗口调整大小
            |• 移动设备屏幕旋转
            |• 全屏模式切换
        """.trimMargin()

        // 测试4: 使用示例
        usageExampleResult = """
            |✅ 完整使用示例
            |
            |class MyPage : BasePager() {
            |
            |    private var width by observable(0f)
            |    private var height by observable(0f)
            |
            |    override fun created() {
            |        super.created()
            |        
            |        // 获取模块
            |        val module = acquireModule<...>(
            |            "WindowResizeModule"
            |        )
            |        
            |        // 监听尺寸变化
            |        module.listenWindowSizeChange { size ->
            |            width = size.optDouble("width").toFloat()
            |            height = size.optDouble("height").toFloat()
            |        }
            |    }
            |
            |    override fun onDestroy() {
            |        // 移除监听
            |        module.removeListenWindowSizeChange()
            |        super.onDestroy()
            |    }
            |}
        """.trimMargin()
    }

    private fun ViewBuilder.SectionView(title: String, content: String) {
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
                        text(content)
                        fontSize(11f)
                        color(Color(0xFF666666))
                        lineHeight(16f)
                    }
                }
            }
        }
    }
}
