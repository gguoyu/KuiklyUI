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
import com.tencent.kuikly.core.base.ViewRef
import com.tencent.kuikly.core.directives.vfor
import com.tencent.kuikly.core.reactive.handler.observable
import com.tencent.kuikly.core.reactive.handler.observableList
import com.tencent.kuikly.core.views.List
import com.tencent.kuikly.core.views.ListView
import com.tencent.kuikly.core.views.Scroller
import com.tencent.kuikly.core.views.ScrollerView
import com.tencent.kuikly.core.views.Text
import com.tencent.kuikly.core.views.View
import com.tencent.kuikly.demo.pages.base.BasePager

/**
 * WebRenderTestListPage - KRListView / KRScrollView 全属性覆盖测试页面
 *
 * 覆盖属性：
 * - scrollEnabled: 是否允许滚动
 * - showScrollerIndicator: 是否显示滚动条
 * - directionRow: 滚动方向（水平/垂直）
 * - pagingEnabled: 是否启用分页
 * - bouncesEnable: 是否启用弹性效果
 * - nestedScroll: 是否启用嵌套滚动
 * - overflow: 溢出处理
 * - borderRadius: 边框圆角
 *
 * 覆盖事件：
 * - scroll: 滚动事件
 * - scrollEnd: 滚动结束事件
 * - dragBegin: 拖拽开始事件
 * - dragEnd: 拖拽结束事件
 * - willDragEnd: 即将结束拖拽事件
 *
 * 覆盖 call 方法：
 * - contentOffset: 设置内容偏移量
 * - contentInset: 设置内容内边距
 */
@Page("WebRenderTestList")
internal class WebRenderTestListPage : BasePager() {

    // 滚动状态文本
    private var scrollStatus by observable("未滚动")
    private var scrollEndStatus by observable("未触发")
    private var dragBeginStatus by observable("未触发")
    private var dragEndStatus by observable("未触发")
    private var willDragEndStatus by observable("未触发")

    // 列表引用
    private lateinit var verticalListRef: ViewRef<ListView<*, *>>
    private lateinit var scrollerRef: ViewRef<ScrollerView<*, *>>

    // 测试数据列表
    private var testItems by observableList<String>()

    override fun created() {
        super.created()
        // 初始化测试数据
        for (i in 1..20) {
            testItems.add("Item $i")
        }
    }

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

                // ========== Section 1: 基本垂直滚动 ==========
                View {
                    attr {
                        padding(all = 16f)
                    }
                    Text {
                        attr {
                            fontSize(18f)
                            fontWeightBold()
                            color(Color.BLACK)
                            text("1. List - 基本垂直滚动")
                        }
                    }
                }

                View {
                    attr {
                        marginLeft(16f)
                        marginRight(16f)
                        height(200f)
                        borderRadius(8f)
                        borderWidth(1f)
                        borderColor(Color(0xFFCCCCCC))
                        overflow(true)
                    }
                    List {
                        ref {
                            ctx.verticalListRef = it
                        }
                        attr {
                            flex(1f)
                            backgroundColor(Color(0xFFF5F5F5))
                        }
                        event {
                            scroll {
                                ctx.scrollStatus = "滚动中: offsetY=${it.offsetY.toInt()}"
                            }
                            scrollEnd {
                                ctx.scrollEndStatus = "触发: offsetY=${it.offsetY.toInt()}"
                            }
                            dragBegin {
                                ctx.dragBeginStatus = "触发"
                            }
                            dragEnd {
                                ctx.dragEndStatus = "触发"
                            }
                            willDragEnd {
                                ctx.willDragEndStatus = "触发"
                            }
                        }
                        vfor({ ctx.testItems }) { item ->
                            View {
                                attr {
                                    padding(all = 12f)
                                    backgroundColor(Color.WHITE)
                                    marginBottom(1f)
                                }
                                Text {
                                    attr {
                                        fontSize(14f)
                                        color(Color.BLACK)
                                        text(item)
                                    }
                                }
                            }
                        }
                    }
                }

                // 滚动事件状态显示
                View {
                    attr {
                        padding(all = 16f)
                    }
                    Text {
                        attr {
                            fontSize(14f)
                            color(Color(0xFF666666))
                            text("scroll事件: ${ctx.scrollStatus}")
                        }
                    }
                    Text {
                        attr {
                            marginTop(4f)
                            fontSize(14f)
                            color(Color(0xFF666666))
                            text("scrollEnd事件: ${ctx.scrollEndStatus}")
                        }
                    }
                    Text {
                        attr {
                            marginTop(4f)
                            fontSize(14f)
                            color(Color(0xFF666666))
                            text("dragBegin事件: ${ctx.dragBeginStatus}")
                        }
                    }
                    Text {
                        attr {
                            marginTop(4f)
                            fontSize(14f)
                            color(Color(0xFF666666))
                            text("dragEnd事件: ${ctx.dragEndStatus}")
                        }
                    }
                    Text {
                        attr {
                            marginTop(4f)
                            fontSize(14f)
                            color(Color(0xFF666666))
                            text("willDragEnd事件: ${ctx.willDragEndStatus}")
                        }
                    }
                }

                // ========== Section 2: scrollEnabled=false ==========
                View {
                    attr {
                        padding(all = 16f)
                        marginTop(16f)
                    }
                    Text {
                        attr {
                            fontSize(18f)
                            fontWeightBold()
                            color(Color.BLACK)
                            text("2. scrollEnabled=false (禁止滚动)")
                        }
                    }
                }

                View {
                    attr {
                        marginLeft(16f)
                        marginRight(16f)
                        height(120f)
                        borderRadius(8f)
                        borderWidth(1f)
                        borderColor(Color(0xFFCCCCCC))
                        overflow(true)
                    }
                    List {
                        attr {
                            flex(1f)
                            backgroundColor(Color(0xFFFFF0F0))
                            scrollEnabled(false)
                        }
                        for (i in 1..10) {
                            View {
                                attr {
                                    padding(all = 10f)
                                    backgroundColor(Color.WHITE)
                                    marginBottom(1f)
                                }
                                Text {
                                    attr {
                                        fontSize(14f)
                                        color(Color.BLACK)
                                        text("禁止滚动项 $i")
                                    }
                                }
                            }
                        }
                    }
                }

                // ========== Section 3: 水平滚动 (directionRow=true) ==========
                View {
                    attr {
                        padding(all = 16f)
                        marginTop(16f)
                    }
                    Text {
                        attr {
                            fontSize(18f)
                            fontWeightBold()
                            color(Color.BLACK)
                            text("3. directionRow=true (水平滚动)")
                        }
                    }
                }

                View {
                    attr {
                        marginLeft(16f)
                        marginRight(16f)
                        height(100f)
                        borderRadius(8f)
                        borderWidth(1f)
                        borderColor(Color(0xFFCCCCCC))
                        overflow(true)
                    }
                    List {
                        attr {
                            flex(1f)
                            backgroundColor(Color(0xFFF0FFF0))
                            directionRow(true)
                        }
                        for (i in 1..15) {
                            View {
                                attr {
                                    width(100f)
                                    height(80f)
                                    marginRight(8f)
                                    marginTop(10f)
                                    marginLeft(if (i == 1) 8f else 0f)
                                    backgroundColor(Color(0xFF4CAF50))
                                    borderRadius(8f)
                                    allCenter()
                                }
                                Text {
                                    attr {
                                        fontSize(14f)
                                        color(Color.WHITE)
                                        text("H-$i")
                                    }
                                }
                            }
                        }
                    }
                }

                // ========== Section 4: pagingEnabled=true ==========
                View {
                    attr {
                        padding(all = 16f)
                        marginTop(16f)
                    }
                    Text {
                        attr {
                            fontSize(18f)
                            fontWeightBold()
                            color(Color.BLACK)
                            text("4. pagingEnabled=true (分页滚动)")
                        }
                    }
                }

                View {
                    attr {
                        marginLeft(16f)
                        marginRight(16f)
                        height(150f)
                        borderRadius(8f)
                        borderWidth(1f)
                        borderColor(Color(0xFFCCCCCC))
                        overflow(true)
                    }
                    List {
                        attr {
                            flex(1f)
                            backgroundColor(Color(0xFFF0F0FF))
                            directionRow(true)
                            pagingEnabled(true)
                        }
                        // 创建3个"页面"
                        for (i in 1..3) {
                            View {
                                attr {
                                    // 每个页面宽度需要占满可视区域
                                    width(343f) // 375 - 16*2 = 343
                                    height(150f)
                                    allCenter()
                                    backgroundColor(
                                        when (i) {
                                            1 -> Color(0xFF2196F3)
                                            2 -> Color(0xFFFF9800)
                                            else -> Color(0xFF9C27B0)
                                        }
                                    )
                                }
                                Text {
                                    attr {
                                        fontSize(24f)
                                        fontWeightBold()
                                        color(Color.WHITE)
                                        text("Page $i")
                                    }
                                }
                            }
                        }
                    }
                }

                // ========== Section 5: bouncesEnable ==========
                View {
                    attr {
                        padding(all = 16f)
                        marginTop(16f)
                    }
                    Text {
                        attr {
                            fontSize(18f)
                            fontWeightBold()
                            color(Color.BLACK)
                            text("5. bouncesEnable=false (禁用弹性)")
                        }
                    }
                }

                View {
                    attr {
                        marginLeft(16f)
                        marginRight(16f)
                        height(120f)
                        borderRadius(8f)
                        borderWidth(1f)
                        borderColor(Color(0xFFCCCCCC))
                        overflow(true)
                    }
                    List {
                        attr {
                            flex(1f)
                            backgroundColor(Color(0xFFFFFFF0))
                            bouncesEnable(false)
                        }
                        for (i in 1..10) {
                            View {
                                attr {
                                    padding(all = 10f)
                                    backgroundColor(Color.WHITE)
                                    marginBottom(1f)
                                }
                                Text {
                                    attr {
                                        fontSize(14f)
                                        color(Color.BLACK)
                                        text("无弹性滚动项 $i")
                                    }
                                }
                            }
                        }
                    }
                }

                // ========== Section 6: showScrollerIndicator ==========
                View {
                    attr {
                        padding(all = 16f)
                        marginTop(16f)
                    }
                    Text {
                        attr {
                            fontSize(18f)
                            fontWeightBold()
                            color(Color.BLACK)
                            text("6. showScrollerIndicator 对比")
                        }
                    }
                }

                View {
                    attr {
                        marginLeft(16f)
                        marginRight(16f)
                        flexDirectionRow()
                    }
                    // 显示滚动条
                    View {
                        attr {
                            flex(1f)
                            height(120f)
                            marginRight(8f)
                            borderRadius(8f)
                            borderWidth(1f)
                            borderColor(Color(0xFFCCCCCC))
                            overflow(true)
                        }
                        View {
                            attr {
                                padding(top = 4f, left = 8f, right = 8f)
                            }
                            Text {
                                attr {
                                    fontSize(12f)
                                    color(Color(0xFF999999))
                                    text("显示滚动条")
                                }
                            }
                        }
                        List {
                            attr {
                                flex(1f)
                                backgroundColor(Color(0xFFF5F5F5))
                                showScrollerIndicator(true)
                            }
                            for (i in 1..10) {
                                View {
                                    attr {
                                        padding(all = 8f)
                                        backgroundColor(Color.WHITE)
                                        marginBottom(1f)
                                    }
                                    Text {
                                        attr {
                                            fontSize(12f)
                                            color(Color.BLACK)
                                            text("项目 $i")
                                        }
                                    }
                                }
                            }
                        }
                    }
                    // 隐藏滚动条
                    View {
                        attr {
                            flex(1f)
                            height(120f)
                            borderRadius(8f)
                            borderWidth(1f)
                            borderColor(Color(0xFFCCCCCC))
                            overflow(true)
                        }
                        View {
                            attr {
                                padding(top = 4f, left = 8f, right = 8f)
                            }
                            Text {
                                attr {
                                    fontSize(12f)
                                    color(Color(0xFF999999))
                                    text("隐藏滚动条")
                                }
                            }
                        }
                        List {
                            attr {
                                flex(1f)
                                backgroundColor(Color(0xFFF5F5F5))
                                showScrollerIndicator(false)
                            }
                            for (i in 1..10) {
                                View {
                                    attr {
                                        padding(all = 8f)
                                        backgroundColor(Color.WHITE)
                                        marginBottom(1f)
                                    }
                                    Text {
                                        attr {
                                            fontSize(12f)
                                            color(Color.BLACK)
                                            text("项目 $i")
                                        }
                                    }
                                }
                            }
                        }
                    }
                }

                // ========== Section 7: Scroller 组件 ==========
                View {
                    attr {
                        padding(all = 16f)
                        marginTop(16f)
                    }
                    Text {
                        attr {
                            fontSize(18f)
                            fontWeightBold()
                            color(Color.BLACK)
                            text("7. Scroller 组件")
                        }
                    }
                }

                View {
                    attr {
                        marginLeft(16f)
                        marginRight(16f)
                        height(150f)
                        borderRadius(8f)
                        borderWidth(1f)
                        borderColor(Color(0xFFCCCCCC))
                        overflow(true)
                    }
                    Scroller {
                        ref {
                            ctx.scrollerRef = it
                        }
                        attr {
                            flex(1f)
                            backgroundColor(Color(0xFFF0F8FF))
                        }
                        View {
                            attr {
                                padding(all = 16f)
                            }
                            Text {
                                attr {
                                    fontSize(14f)
                                    color(Color.BLACK)
                                    text("Scroller 内容区域 - 这是一段很长的内容，用于测试 Scroller 组件的滚动功能。" +
                                            "Scroller 和 List 的区别在于，Scroller 适用于内容固定的滚动场景，" +
                                            "而 List 适用于动态数据列表的滚动场景。")
                                }
                            }
                            View {
                                attr {
                                    marginTop(16f)
                                    height(200f)
                                    backgroundColor(Color(0xFF90CAF9))
                                    borderRadius(8f)
                                    allCenter()
                                }
                                Text {
                                    attr {
                                        fontSize(16f)
                                        color(Color.WHITE)
                                        text("Scroller 内的大块内容")
                                    }
                                }
                            }
                            View {
                                attr {
                                    marginTop(16f)
                                    height(200f)
                                    backgroundColor(Color(0xFF81C784))
                                    borderRadius(8f)
                                    allCenter()
                                }
                                Text {
                                    attr {
                                        fontSize(16f)
                                        color(Color.WHITE)
                                        text("更多内容块")
                                    }
                                }
                            }
                        }
                    }
                }

                // ========== Section 8: nestedScroll 嵌套滚动 ==========
                View {
                    attr {
                        padding(all = 16f)
                        marginTop(16f)
                    }
                    Text {
                        attr {
                            fontSize(18f)
                            fontWeightBold()
                            color(Color.BLACK)
                            text("8. nestedScroll (嵌套滚动)")
                        }
                    }
                }

                View {
                    attr {
                        marginLeft(16f)
                        marginRight(16f)
                        height(200f)
                        borderRadius(8f)
                        borderWidth(1f)
                        borderColor(Color(0xFFCCCCCC))
                        overflow(true)
                    }
                    List {
                        attr {
                            flex(1f)
                            backgroundColor(Color(0xFFFCE4EC))
                            nestedScroll(true)
                        }
                        View {
                            attr {
                                padding(all = 12f)
                            }
                            Text {
                                attr {
                                    fontSize(14f)
                                    color(Color.BLACK)
                                    text("外层 List (nestedScroll=true)")
                                }
                            }
                        }
                        // 内嵌 List
                        View {
                            attr {
                                marginLeft(12f)
                                marginRight(12f)
                                height(120f)
                                borderRadius(8f)
                                borderWidth(1f)
                                borderColor(Color(0xFFE91E63))
                                overflow(true)
                            }
                            List {
                                attr {
                                    flex(1f)
                                    backgroundColor(Color(0xFFF8BBD9))
                                }
                                for (i in 1..15) {
                                    View {
                                        attr {
                                            padding(all = 8f)
                                            backgroundColor(Color.WHITE)
                                            marginBottom(1f)
                                        }
                                        Text {
                                            attr {
                                                fontSize(12f)
                                                color(Color.BLACK)
                                                text("内嵌列表项 $i")
                                            }
                                        }
                                    }
                                }
                            }
                        }
                        // 更多外层内容
                        for (i in 1..10) {
                            View {
                                attr {
                                    padding(all = 12f)
                                    marginTop(if (i == 1) 12f else 0f)
                                }
                                Text {
                                    attr {
                                        fontSize(14f)
                                        color(Color.BLACK)
                                        text("外层内容项 $i")
                                    }
                                }
                            }
                        }
                    }
                }

                // ========== Section 9: contentOffset call 方法 ==========
                View {
                    attr {
                        padding(all = 16f)
                        marginTop(16f)
                    }
                    Text {
                        attr {
                            fontSize(18f)
                            fontWeightBold()
                            color(Color.BLACK)
                            text("9. contentOffset call 方法")
                        }
                    }
                    Text {
                        attr {
                            marginTop(8f)
                            fontSize(14f)
                            color(Color(0xFF666666))
                            text("点击按钮可滚动到指定位置")
                        }
                    }
                }

                View {
                    attr {
                        marginLeft(16f)
                        marginRight(16f)
                        flexDirectionRow()
                    }
                    // 滚动到顶部按钮
                    View {
                        attr {
                            flex(1f)
                            height(40f)
                            marginRight(8f)
                            backgroundColor(Color(0xFF2196F3))
                            borderRadius(8f)
                            allCenter()
                        }
                        event {
                            click {
                                ctx.verticalListRef.view?.setContentOffset(0f, 0f, true)
                            }
                        }
                        Text {
                            attr {
                                fontSize(14f)
                                color(Color.WHITE)
                                text("滚动到顶部")
                            }
                        }
                    }
                    // 滚动到中间按钮
                    View {
                        attr {
                            flex(1f)
                            height(40f)
                            marginRight(8f)
                            backgroundColor(Color(0xFFFF9800))
                            borderRadius(8f)
                            allCenter()
                        }
                        event {
                            click {
                                ctx.verticalListRef.view?.setContentOffset(0f, 200f, true)
                            }
                        }
                        Text {
                            attr {
                                fontSize(14f)
                                color(Color.WHITE)
                                text("滚动到200")
                            }
                        }
                    }
                    // 滚动到底部按钮
                    View {
                        attr {
                            flex(1f)
                            height(40f)
                            backgroundColor(Color(0xFF4CAF50))
                            borderRadius(8f)
                            allCenter()
                        }
                        event {
                            click {
                                ctx.verticalListRef.view?.setContentOffset(0f, 500f, true)
                            }
                        }
                        Text {
                            attr {
                                fontSize(14f)
                                color(Color.WHITE)
                                text("滚动到500")
                            }
                        }
                    }
                }

                // ========== Section 10: borderRadius + overflow ==========
                View {
                    attr {
                        padding(all = 16f)
                        marginTop(16f)
                    }
                    Text {
                        attr {
                            fontSize(18f)
                            fontWeightBold()
                            color(Color.BLACK)
                            text("10. borderRadius + overflow")
                        }
                    }
                }

                View {
                    attr {
                        marginLeft(16f)
                        marginRight(16f)
                        marginBottom(32f)
                        height(150f)
                        borderRadius(24f)
                        backgroundColor(Color(0xFFE3F2FD))
                        overflow(true)
                    }
                    List {
                        attr {
                            flex(1f)
                        }
                        for (i in 1..15) {
                            View {
                                attr {
                                    padding(all = 12f)
                                    backgroundColor(
                                        if (i % 2 == 0) Color(0xFF90CAF9) else Color(0xFFBBDEFB)
                                    )
                                }
                                Text {
                                    attr {
                                        fontSize(14f)
                                        color(Color.BLACK)
                                        text("圆角列表项 $i")
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}
