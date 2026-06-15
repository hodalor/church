import 'package:flutter/material.dart';

import '../data/models/kpi_item.dart';

class KPIProgressBar extends StatelessWidget {
  const KPIProgressBar({
    super.key,
    required this.kpi,
  });

  final KPIItem kpi;

  @override
  Widget build(BuildContext context) {
    final progress = kpi.progress.clamp(0, 100) / 100;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: <Widget>[
        Stack(
          children: <Widget>[
            Container(
              height: 10,
              decoration: BoxDecoration(
                color: Colors.grey.shade200,
                borderRadius: BorderRadius.circular(999),
              ),
            ),
            FractionallySizedBox(
              widthFactor: progress.toDouble(),
              child: Container(
                height: 10,
                decoration: BoxDecoration(
                  color: kpi.statusColor,
                  borderRadius: BorderRadius.circular(999),
                ),
              ),
            ),
            Positioned(
              left: 0,
              right: 0,
              child: Align(
                alignment: Alignment((progress * 2) - 1, 0),
                child: Container(
                  width: 2,
                  height: 12,
                  color: Colors.black26,
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 6),
        Row(
          children: <Widget>[
            Text('${kpi.currentValue.toStringAsFixed(0)} ${kpi.unit ?? ''}'),
            const Spacer(),
            Text('${kpi.annualTarget.toStringAsFixed(0)} target'),
          ],
        ),
      ],
    );
  }
}
