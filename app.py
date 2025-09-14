import streamlit as st
import pandas as pd
import numpy as np
import plotly.graph_objects as go

st.set_page_config(page_title="分散と標準偏差", layout="wide")

st.title("分散と標準偏差（pp.29-30）")
st.caption("Created by Dit-Lab.(Daiki ITO)")
st.caption("Supported by Tomoaki ATSUMI")

st.markdown("""
このアプリケーションでは、分散と標準偏差の概念を体験的に学ぶことができます。
データのばらつきを視覚的に理解し、計算プロセスを段階的に確認していきましょう。
""")

def load_demo_data():
    try:
        return pd.read_csv("demo_data.csv")
    except FileNotFoundError:
        demo_data = {
            'データ名': ['テストA'] * 10 + ['テストB'] * 10,
            '値': [68, 70, 72, 74, 76, 78, 80, 82, 84, 86] +
                  [50, 60, 70, 75, 75, 75, 80, 90, 100, 105]
        }
        return pd.DataFrame(demo_data)

def calculate_statistics(data):
    results = {}
    for group in data['データ名'].unique():
        group_data = data[data['データ名'] == group]['値'].values
        mean = np.mean(group_data)
        variance = np.var(group_data, ddof=0)
        std_dev = np.std(group_data, ddof=0)

        deviations = group_data - mean
        squared_deviations = deviations ** 2

        results[group] = {
            'data': group_data,
            'mean': mean,
            'variance': variance,
            'std_dev': std_dev,
            'deviations': deviations,
            'squared_deviations': squared_deviations
        }
    return results

st.header("データ入力と選択")

uploaded_file = st.file_uploader(
    "CSVファイルをアップロードしてください",
    type=['csv'],
    help="ファイル形式：CSV（ヘッダーに「データ名」と「値」の列が必要）"
)

use_demo = st.checkbox("デモデータを使用する")

if use_demo:
    data = load_demo_data()
    st.success("デモデータを読み込みました。平均値は同じですが、ばらつきの異なる2つのテストデータです。")
elif uploaded_file is not None:
    try:
        data = pd.read_csv(uploaded_file)

        if 'データ名' not in data.columns or '値' not in data.columns:
            st.error("CSVファイルには「データ名」と「値」の列が必要です。")
            st.stop()

        if not pd.api.types.is_numeric_dtype(data['値']):
            st.error("「値」列は数値である必要があります。")
            st.stop()

        st.success("ファイルを正常に読み込みました。")

    except Exception as e:
        st.error(f"ファイルの読み込み中にエラーが発生しました: {str(e)}")
        st.stop()
else:
    st.info("CSVファイルをアップロードするか、デモデータを使用してください。")
    st.stop()

if 'data' in locals() and not data.empty:
    stats = calculate_statistics(data)

    st.markdown("---")
    st.header("ステップ1: データの確認と平均値の計算")
    st.markdown("""
    ここでは、入力されたデータの全体像を確認し、データの中心を表す平均値を計算します。
    """)

    st.subheader("📊 データの表示")
    st.dataframe(data, use_container_width=True)

    st.subheader("📈 平均値の計算")
    col1, col2 = st.columns(2)

    for i, (group, group_stats) in enumerate(stats.items()):
        with col1 if i == 0 else col2:
            st.metric(
                label=f"{group}の平均値",
                value=f"{group_stats['mean']:.2f}",
                help="データの合計 ÷ データ数"
            )

    st.subheader("📊 データの分布（ヒストグラム）")

    colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7']

    # データセットが複数ある場合は、各データセット別にグラフを表示
    if len(stats) > 1:
        cols = st.columns(len(stats))

        for i, (group, group_stats) in enumerate(stats.items()):
            with cols[i]:
                fig = go.Figure()

                fig.add_trace(go.Histogram(
                    x=group_stats['data'],
                    name=group,
                    marker_color=colors[i % len(colors)],
                    opacity=0.8,
                    nbinsx=8
                ))

                fig.add_vline(
                    x=group_stats['mean'],
                    line_dash="dash",
                    line_color="black",
                    line_width=2,
                    annotation_text=f"平均: {group_stats['mean']:.1f}",
                    annotation_position="top"
                )

                fig.update_layout(
                    title=f"{group}の分布",
                    xaxis_title="値",
                    yaxis_title="頻度",
                    height=400,
                    showlegend=False
                )

                st.plotly_chart(fig, use_container_width=True)
    else:
        # データセットが1つの場合は通常のヒストグラム
        fig = go.Figure()
        group, group_stats = list(stats.items())[0]

        fig.add_trace(go.Histogram(
            x=group_stats['data'],
            name=group,
            marker_color=colors[0],
            opacity=0.8,
            nbinsx=10
        ))

        fig.add_vline(
            x=group_stats['mean'],
            line_dash="dash",
            line_color="black",
            line_width=2,
            annotation_text=f"平均値: {group_stats['mean']:.2f}",
            annotation_position="top"
        )

        fig.update_layout(
            title="データの分布と平均値",
            xaxis_title="値",
            yaxis_title="頻度",
            height=500
        )

        st.plotly_chart(fig, use_container_width=True)

    st.markdown("---")
    st.header("ステップ2: 分散の計算と理解")
    st.markdown("""
    平均値だけではわからない、データのばらつきを数値で表すのが分散です。
    ここでは、分散を計算するプロセスを順を追って見ていきましょう。
    """)

    for group, group_stats in stats.items():
        st.subheader(f"🔍 {group}の分散計算")

        st.write("**1. 偏差の計算（各データ - 平均値）**")
        deviation_df = pd.DataFrame({
            'データ': group_stats['data'],
            '平均値': [group_stats['mean']] * len(group_stats['data']),
            '偏差': group_stats['deviations']
        })
        deviation_df['偏差'] = deviation_df['偏差'].round(2)
        st.dataframe(deviation_df, use_container_width=True)

        st.write("**2. 偏差の2乗**")
        squared_df = pd.DataFrame({
            '偏差': group_stats['deviations'].round(2),
            '偏差の2乗': group_stats['squared_deviations'].round(2)
        })
        st.dataframe(squared_df, use_container_width=True)

        st.write("**3. 分散の計算**")
        variance_calculation = f"""
        分散 = (偏差の2乗の合計) ÷ データ数
        分散 = {group_stats['squared_deviations'].sum():.2f} ÷ {len(group_stats['data'])}
        分散 = **{group_stats['variance']:.2f}**
        """
        st.markdown(variance_calculation)

        fig_scatter = go.Figure()

        data_indices = [i+1 for i in range(len(group_stats['data']))]

        fig_scatter.add_trace(go.Scatter(
            x=data_indices,
            y=group_stats['data'],
            mode='markers',
            name='データ点',
            marker=dict(size=10, color='#FF6B6B'),
            text=[f"値: {val}, 偏差: {dev:.2f}" for val, dev in zip(group_stats['data'], group_stats['deviations'])],
            hovertemplate='データ点 %{x}<br>値: %{y}<br>%{text}<extra></extra>'
        ))

        fig_scatter.add_hline(
            y=group_stats['mean'],
            line_dash="dash",
            line_color="blue",
            annotation_text=f"平均値: {group_stats['mean']:.2f}"
        )

        for i, (val, dev) in enumerate(zip(group_stats['data'], group_stats['deviations'])):
            fig_scatter.add_shape(
                type="line",
                x0=i+1, y0=val,
                x1=i+1, y1=group_stats['mean'],
                line=dict(color="gray", width=1, dash="dot")
            )

        fig_scatter.update_layout(
            title=f"{group}: データ点と平均値からの距離（偏差）",
            xaxis_title="データ番号",
            yaxis_title="値",
            height=400
        )

        st.plotly_chart(fig_scatter, use_container_width=True)
        st.markdown("---")

    st.header("ステップ3: 標準偏差の計算と活用")
    st.markdown("""
    標準偏差は、分散の平方根をとったもので、ばらつきの大きさを元のデータの単位で表します。

    **標準偏差の重要な性質：**
    標準偏差は、平均値を基準に上下1標準偏差の範囲に、おおよそ68%のデータが収束しているという統計的な性質があります。
    これにより、データのばらつき具合を直感的に把握することができます。
    """)

    col1, col2, col3 = st.columns(3)

    for i, (group, group_stats) in enumerate(stats.items()):
        with col1 if i == 0 else col2 if i == 1 else col3:
            st.subheader(f"📊 {group}")
            st.metric("分散", f"{group_stats['variance']:.2f}")
            st.metric("標準偏差", f"{group_stats['std_dev']:.2f}")

            calculation = f"""
            標準偏差 = √分散
            標準偏差 = √{group_stats['variance']:.2f}
            標準偏差 = **{group_stats['std_dev']:.2f}**
            """
            st.markdown(calculation)

    st.subheader("📊 標準偏差の視覚化")

    fig_std = go.Figure()

    for i, (group, group_stats) in enumerate(stats.items()):
        fig_std.add_trace(go.Histogram(
            x=group_stats['data'],
            name=group,
            opacity=0.7,
            marker_color=colors[i % len(colors)],
            nbinsx=15
        ))

        mean = group_stats['mean']
        std = group_stats['std_dev']

        fig_std.add_vline(
            x=mean,
            line_color=colors[i % len(colors)],
            line_width=3,
            annotation_text=f"{group}平均値"
        )

        fig_std.add_vrect(
            x0=mean - std, x1=mean + std,
            fillcolor=colors[i % len(colors)],
            opacity=0.2,
            layer="below",
            annotation_text=f"{group}±1標準偏差",
            annotation_position="top" if i == 0 else "bottom"
        )

    fig_std.update_layout(
        title="データ分布と標準偏差の範囲（±1標準偏差）",
        xaxis_title="値",
        yaxis_title="頻度",
        barmode='overlay',
        height=500
    )

    st.plotly_chart(fig_std, use_container_width=True)

    st.subheader("📈 実際のデータ含有率の確認")
    st.markdown("各データセットで、平均値±1標準偏差の範囲に実際に含まれるデータの割合を確認してみましょう。")

    coverage_cols = st.columns(len(stats))

    for i, (group, group_stats) in enumerate(stats.items()):
        with coverage_cols[i] if len(stats) > 1 else st:
            mean = group_stats['mean']
            std = group_stats['std_dev']
            data = group_stats['data']

            # ±1標準偏差範囲内のデータを計算
            within_1std = np.sum((data >= mean - std) & (data <= mean + std))
            total_data = len(data)
            percentage = (within_1std / total_data) * 100

            st.metric(
                label=f"{group}: ±1標準偏差範囲内",
                value=f"{within_1std}/{total_data}",
                delta=f"{percentage:.1f}%"
            )

            range_text = f"範囲: {mean - std:.1f} ～ {mean + std:.1f}"
            st.caption(range_text)

    st.info("💡 一般的に、正規分布に従うデータでは約68%が±1標準偏差の範囲内に含まれます。")

    st.markdown("---")
    st.header("まとめと応用")
    st.markdown("""
    これらの指標を使って、データセットのばらつきを比較してみましょう。
    """)

    st.subheader("📈 統計量の比較表")

    summary_data = []
    for group, group_stats in stats.items():
        summary_data.append({
            'データセット': group,
            'データ数': len(group_stats['data']),
            '平均値': round(group_stats['mean'], 2),
            '分散': round(group_stats['variance'], 2),
            '標準偏差': round(group_stats['std_dev'], 2)
        })

    summary_df = pd.DataFrame(summary_data)
    st.dataframe(summary_df, use_container_width=True)

    st.subheader("🔍 結論")

    if len(stats) >= 2:
        groups = list(stats.keys())
        group1, group2 = groups[0], groups[1]
        std1, std2 = stats[group1]['std_dev'], stats[group2]['std_dev']
        var1, var2 = stats[group1]['variance'], stats[group2]['variance']

        if std1 > std2:
            larger_std_group, smaller_std_group = group1, group2
            larger_std, smaller_std = std1, std2
        else:
            larger_std_group, smaller_std_group = group2, group1
            larger_std, smaller_std = std2, std1

        conclusion = f"""
        **分析結果：**

        - **{larger_std_group}**の標準偏差（{larger_std:.2f}）が**{smaller_std_group}**の標準偏差（{smaller_std:.2f}）よりも大きい
        - これは**{larger_std_group}**の方がデータのばらつきが大きいことを意味します
        - 平均値が同じでも、分散と標準偏差によってデータの特徴が大きく異なることがわかります

        **実用的な意味：**
        - テストの成績で考えると、{larger_std_group}は成績の差が大きく、{smaller_std_group}は成績が平均付近に集中している
        - 品質管理では、標準偏差が小さい方が安定した製品を意味する
        """
        st.markdown(conclusion)

    else:
        st.info("2つ以上のデータセットがある場合、比較分析を表示します。")

else:
    st.info("データを入力してください。")

st.markdown("---")
st.subheader("🎯 学習のポイント")
points = """
1. **平均値**：データの中心を表す
2. **分散**：データのばらつきを表す（単位が2乗される）
3. **標準偏差**：分散の平方根で、元のデータと同じ単位でばらつきを表す
4. **視覚化の重要性**：数値だけでなく、グラフで確認することで直感的に理解できる
5. **実用性**：品質管理、成績評価、リスク評価など様々な分野で活用される
"""
st.markdown(points)