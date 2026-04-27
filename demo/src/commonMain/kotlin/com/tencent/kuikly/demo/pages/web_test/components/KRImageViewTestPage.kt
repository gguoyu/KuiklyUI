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

package com.tencent.kuikly.demo.pages.web_test.components

import com.tencent.kuikly.core.annotations.Page
import com.tencent.kuikly.core.base.BoxShadow
import com.tencent.kuikly.core.base.Color
import com.tencent.kuikly.core.base.ColorStop
import com.tencent.kuikly.core.base.Direction
import com.tencent.kuikly.core.base.ViewBuilder
import com.tencent.kuikly.core.pager.Pager
import com.tencent.kuikly.core.views.Image
import com.tencent.kuikly.core.views.List
import com.tencent.kuikly.core.views.Text
import com.tencent.kuikly.core.views.View

/**
 * KRImageView 图片渲染验证测试页面
 *
 * 测试覆盖：
 * 1. 不同缩放模式（Contain/Cover/Stretch）
 * 2. 不同尺寸的图片
 * 3. 圆角图片
 * 4. 圆形图片
 * 5. 带阴影的图片
 *
 * 注意：使用固定不变的图片 URL，确保截图稳定
 */
@Page("KRImageViewTestPage")
internal class KRImageViewTestPage : Pager() {

    companion object {
        // 使用固定的测试图片 URL（不带随机参数，确保每次返回相同图片）
        const val TEST_IMAGE_URL = "https://vfiles.gtimg.cn/wuji_dashboard/xy/componenthub/Dfnp7Q9F.png"
    }

    override fun body(): ViewBuilder {
        return {
            attr {
                backgroundColor(Color.WHITE)
            }

            List {
                attr {
                    flex(1f)
                }

                // === Section 1: resizeContain ===
                Text {
                    attr {
                        text("1. resizeContain（包含模式）")
                        fontSize(16f)
                        fontWeightBold()
                        marginTop(16f)
                        marginLeft(16f)
                        color(Color.BLACK)
                    }
                }
                View {
                    attr {
                        allCenter()
                        padding(all = 16f)
                    }
                    Image {
                        attr {
                            size(200f, 150f)
                            src(TEST_IMAGE_URL)
                            resizeContain()
                            backgroundColor(0xFFE5E5E5)
                        }
                    }
                }

                // === Section 2: resizeCover ===
                Text {
                    attr {
                        text("2. resizeCover（覆盖模式）")
                        fontSize(16f)
                        fontWeightBold()
                        marginTop(12f)
                        marginLeft(16f)
                        color(Color.BLACK)
                    }
                }
                View {
                    attr {
                        allCenter()
                        padding(all = 16f)
                    }
                    Image {
                        attr {
                            size(200f, 150f)
                            src(TEST_IMAGE_URL)
                            resizeCover()
                            backgroundColor(0xFFE5E5E5)
                        }
                    }
                }

                // === Section 3: resizeStretch ===
                Text {
                    attr {
                        text("3. resizeStretch（拉伸模式）")
                        fontSize(16f)
                        fontWeightBold()
                        marginTop(12f)
                        marginLeft(16f)
                        color(Color.BLACK)
                    }
                }
                View {
                    attr {
                        allCenter()
                        padding(all = 16f)
                    }
                    Image {
                        attr {
                            size(200f, 150f)
                            src(TEST_IMAGE_URL)
                            resizeStretch()
                            backgroundColor(0xFFE5E5E5)
                        }
                    }
                }

                // === Section 4: 不同尺寸 ===
                Text {
                    attr {
                        text("4. 不同尺寸")
                        fontSize(16f)
                        fontWeightBold()
                        marginTop(12f)
                        marginLeft(16f)
                        color(Color.BLACK)
                    }
                }
                View {
                    attr {
                        flexDirectionRow()
                        alignItemsCenter()
                        justifyContentSpaceAround()
                        padding(all = 16f)
                    }
                    Image {
                        attr {
                            size(50f, 50f)
                            src(TEST_IMAGE_URL)
                            resizeCover()
                        }
                    }
                    Image {
                        attr {
                            size(80f, 80f)
                            src(TEST_IMAGE_URL)
                            resizeCover()
                        }
                    }
                    Image {
                        attr {
                            size(120f, 120f)
                            src(TEST_IMAGE_URL)
                            resizeCover()
                        }
                    }
                }

                // === Section 5: 圆角图片 ===
                Text {
                    attr {
                        text("5. 圆角图片")
                        fontSize(16f)
                        fontWeightBold()
                        marginTop(12f)
                        marginLeft(16f)
                        color(Color.BLACK)
                    }
                }
                View {
                    attr {
                        flexDirectionRow()
                        alignItemsCenter()
                        justifyContentSpaceAround()
                        padding(all = 16f)
                    }
                    // 小圆角
                    Image {
                        attr {
                            size(80f, 80f)
                            src(TEST_IMAGE_URL)
                            resizeCover()
                            borderRadius(8f)
                        }
                    }
                    // 大圆角
                    Image {
                        attr {
                            size(80f, 80f)
                            src(TEST_IMAGE_URL)
                            resizeCover()
                            borderRadius(20f)
                        }
                    }
                    // 圆形
                    Image {
                        attr {
                            size(80f, 80f)
                            src(TEST_IMAGE_URL)
                            resizeCover()
                            borderRadius(40f)
                        }
                    }
                }

                // === Section 6: 带阴影的图片 ===
                Text {
                    attr {
                        text("6. 带阴影的图片")
                        fontSize(16f)
                        fontWeightBold()
                        marginTop(12f)
                        marginLeft(16f)
                        color(Color.BLACK)
                    }
                }
                View {
                    attr {
                        allCenter()
                        padding(all = 24f)
                    }
                    Image {
                        attr {
                            size(200f, 150f)
                            src(TEST_IMAGE_URL)
                            resizeCover()
                            borderRadius(12f)
                            boxShadow(BoxShadow(4f, 4f, 16f, Color(0x66000000)))
                        }
                    }
                }

                // === Section 7: Mask Linear Gradient ===
                Text {
                    attr {
                        text("7. Mask Gradient")
                        fontSize(16f)
                        fontWeightBold()
                        marginTop(12f)
                        marginLeft(16f)
                        color(Color.BLACK)
                    }
                }
                View {
                    attr {
                        allCenter()
                        padding(all = 24f)
                    }
                    Image {
                        attr {
                            size(200f, 150f)
                            src(TEST_IMAGE_URL)
                            resizeCover()
                            borderRadius(12f)
                            maskLinearGradient(
                                Direction.TO_BOTTOM,
                                ColorStop(Color(0xFFFFFFFF), 0f),
                                ColorStop(Color(0x00FFFFFF), 1f)
                            )
                        }
                    }
                }

                // === Section 8: Blur Radius ===
                Text {
                    attr {
                        text("8. Blur Radius")
                        fontSize(16f)
                        fontWeightBold()
                        marginTop(12f)
                        marginLeft(16f)
                        color(Color.BLACK)
                    }
                }
                View {
                    attr {
                        flexDirectionRow()
                        alignItemsCenter()
                        justifyContentSpaceAround()
                        padding(all = 16f)
                    }
                    Image {
                        attr {
                            size(80f, 80f)
                            src(TEST_IMAGE_URL)
                            resizeCover()
                            blurRadius(4f)
                        }
                    }
                    Image {
                        attr {
                            size(80f, 80f)
                            src(TEST_IMAGE_URL)
                            resizeCover()
                            blurRadius(10f)
                        }
                    }
                }

            }
        }
    }
}
